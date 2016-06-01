import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HTTP } from 'meteor/http';
const mammoth = require('./lib/mammoth.browser.min.js');

import './main.html';

// import { getServiceData } from '../imports/api/trello/methods.js';
Template.Mammoth.onCreated(() => {
    const instance = Template.instance();

    // Mammoth
    instance._docxHTML = new ReactiveVar(null);
    instance._docxUrl = new ReactiveVar(null); // https://www.dropbox.com/s/8lvo9npc4zy4q4e/template.docx?dl=1

    instance._getDocxFromUrl = (url, options = {}) => {
        options = {
            // Style output html with CSS classes - h1.green, h1.red
            styleMap: [
                "p.Heading => header > h1.green",
                "p.Heading1 => h1.red",
            ]
        };

        // Convert .docx to html on server side
        instance._docxHTML.set('Converting .docx to html ...');
        Meteor.call('mammoth.getHtmlFromDocxUrl', url, (error, result) => {
            if (error) {
                console.log(`Error: ${error}`);
                instance._docxHTML.set(`Conversion failed: ${error.error}`);
            } else {
                instance._docxHTML.set(result);
            }
        });

        // // Convert .docx to html on client side
        // // FIXME: result from HTTP.call returned as weird strings instead of 'arraybuffer'
        // //     FIXED: meteor add aldeed:http
        // // FIXME: Fails to convert some urls
        // instance._docxHTML.set('Loading .docx ...');
        // HTTP.call('GET', url, {
        //     responseType: 'arraybuffer', // requires aldeed:http package
        // }, function(error, result) {
        //     if (error) {
        //         console.log(`HTTP.call: ${error}`);
        //         instance._docxHTML.set(`Loading failed: ${error}`);
        //     } else {
        //         console.log('Response: ', result.content);
        //         instance._docxHTML.set('Converting .docx to html ...');
        //         mammoth.convertToHtml({ arrayBuffer: result.content }, options)
        //             .then((result) => {
        //                 console.log('Messages: ', result.messages);
        //                 instance._docxHTML.set(result.value);
        //             })
        //             .catch(function(e) {
        //                 console.log(e); // "oh, no!"
        //                 instance._docxHTML.set(`Convertion failed: ${e}`);
        //             })
        //             .done();
        //     }
        // });

        // // Convert .docx to html on client side
        // // FIXME: Fails to convert some urls
        // instance._docxHTML.set('Loading .docx ...');
        // const xhr = new XMLHttpRequest();
        // xhr.open('GET', url, true);
        // xhr.responseType = 'arraybuffer';

        // xhr.onload = (e) => {
        //     console.log('Response: ', xhr.response);
        //     instance._docxHTML.set('Converting .docx to html ...');
        //     mammoth.convertToHtml({ arrayBuffer: xhr.response }, options)
        //         .then((result) => {
        //             console.log('Messages: ', result.messages);
        //             instance._docxHTML.set(result.value);
        //         })
        //         .catch((e) => {
        //             console.log(e); // "oh, no!"
        //             instance._docxHTML.set(`Convertion failed: ${e}`);
        //         })
        //         .done();
        // };
        // xhr.onerror = (e) => {
        //     console.log(e); // "oh, no!"
        //     instance._docxHTML.set(`Loading failed: ${e}`);
        // }
        // xhr.send();
    }
});
Template.Mammoth.helpers({
    docxHtml() {
        return Template.instance()._docxHTML.get();
    },
    docxUrl() {
        return Template.instance()._docxUrl.get();
    }
});
Template.Mammoth.events({
    'click #conver-docx-to-html, submit form' (event, instance) {
        event.preventDefault();
        instance._getDocxFromUrl(instance._docxUrl.get());
    },
    'input #docx-url-input': _.debounce((event, instance) => {
        // TODO: verify URL string - event.target.value
        instance._docxUrl.set(event.target.value)
    }, 300),
});
