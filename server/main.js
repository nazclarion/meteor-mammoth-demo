import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { HTTP } from 'meteor/http';
const Future = require('fibers/future');
const mammoth = require('mammoth');

const fs = require('fs');

const saveHtmlFile = (htmlString) => {
    // TODO: improve temporary file life cycle
    const dateString = new Date().toISOString();
    const filePath = `/tmp/${dateString}_docx_file.html`;
    let result = null;
    try {
        fs.writeFile(filePath, htmlString);
        console.log(`File saved: ${filePath}`);
        result = filePath;
    } catch (e) {
        console.log(e);
    }

    return result;
};

const uploadFileToS3 = (filePath) => {
    // TODO: implement loading file to S3
    console.log(`File "${filePath}" sent to S3`);
};

Meteor.methods({
    'mammoth.getHtmlFromDocxUrl': function(url, options = {}) {
        check(url, String);
        this.unblock();

        options = {
            styleMap: [
                "p.Heading => header > h1.green",
                "p.Heading1 => h1.red",
            ]
        };

        const fut = new Future();
        HTTP.call('GET', url, {
            npmRequestOptions: {
                encoding: null
            },
            responseType: 'buffer', // requires aldeed:http package
        }, (error, result) => {
            if (error) {
                fut.return(new Meteor.Error(error));
            }

            if (result.headers['content-type'] !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                fut.return(new Meteor.Error('TypeError', `Invalid content type - ${result.headers['content-type']}`));
            }

            // mammoth.convertToHtml({ buffer: new Buffer(result.content, 'utf8') }, options)
            mammoth.convertToHtml({ buffer: result.content }, options)
                .then((result) => {
                    console.log('Messages: ', result.messages);
                    const filePath = saveHtmlFile(result.value);
                    if (filePath) {
                        uploadFileToS3(filePath);
                    }

                    fut.return(result.value);
                })
                .catch((e) => {
                    console.log('Mammoth catch: ', e.TypeError);
                    fut.return(e);
                })
                .done();
        });

        return fut.wait();
    },
    // 'mammoth.convertToHtml' (path, options = {}) {
    //     check(path, String);

    //     const fut = new Future();
    //     mammoth.convertToHtml({ path: path }, options)
    //         .then((result) => {
    //             console.log('Messages: ', result.messages);
    //             fut.return(result.value);
    //         })
    //         .done();
    //     return fut.wait();
    // },
});
