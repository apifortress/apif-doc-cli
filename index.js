const apifdoc   = require ('apif-doc')
const args      = require ('minimist')(process.argv.slice(2))
const clear     = require ('clear')
const chalk     = require ('chalk')
const fs        = require ('fs')
const inquirer 	= require ('inquirer');
const pdf       = require ('html-pdf');
const Spinner 	= require ('cli-spinner').Spinner;


const status 	= new Spinner ('Creating document, please wait ...');
status.setSpinnerString (21);


const wizard = () => {
    const questions = [
    	{
            name: 'input',
            type: 'input',
            message: 'Document input file path',
            default: 'input.json'
        },
        {
            name: 'output',
            type: 'input',
            message: 'Output path',
            default: './'
        }
    ];
    return inquirer.prompt (questions)
}

const generate_document = (opts) => {
    return new Promise ((resolve, reject) => {
        status.start ();
        opts.input = opts.input.trim ();
        opts.output = opts.output.trim ();
        fs.readFile (opts.input, { encoding: 'utf-8' }, (error, data) => {
            if (error)
                resolve ({ success: false, error: 'Unble to load input file ' + opts.input });

            let json_input  = null,
                timestamp   = new Date().getTime ();
    
            try {
                json_input = JSON.parse (data)
            } catch (e) { }
    
            if (json_input) {
                apifdoc.renderHTML (json_input, { cli: true }).then ((html) => {
                    pdf.create (html, { format: 'A4' }).toFile (opts.output + 'document_'+ timestamp +'.pdf', () => {
                        fs.writeFile (opts.output + 'document_'+ timestamp +'.html', html, (error) => {
                            status.stop (true);
                            if (error)
                                resolve ({ success: false, error: 'Unable to write in the specified output location.' });
                            else
                                resolve ({ success: true, doc: opts.output });
                        });
                    });
                });
            } else 
                resolve ({ success: false, error: 'Invalid input file synthax.' });
        })
    })
}

const render_result = (result) => {
    if (result.success)
        console.log (chalk.green.bold ('\nDocument successfully generated' + '\n')),
        process.exit (0);
    else
        console.log (chalk.red.bold ('\nError while generating report document: \n' + result.error + '\n')),
        process.exit (1);
}

const run = () => {
    console.log (chalk.bgWhite ('API Fortress Report Document'));
    if (args.skipwizard === 'true') {
        if (args.input !== undefined && args.output !== undefined) {
            generate_document ({
                input: args.input,
                output: args.output
            }).then (render_result)
        } else
            console.log (chalk.red.bold ('\nInvalid input: missing arguments. \n'));
    }
    
    else
        wizard ().then ((settings) => {
            generate_document (settings).then (render_result)
        })
}

clear ();
run ();