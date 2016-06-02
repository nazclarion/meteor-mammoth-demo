import './main.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

const htmlToBlob = (htmlString) => {
    return new Blob([htmlString], { type: 'text/html' });
}

const validateURL = (urlString) => {
    var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlregex.test(urlString);
}

const validateDocxExt = (urlString) => {
    return urlString.match(/\.([^\./\?]+)($|\?)/)[1];
}

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
                // HTTP.call errors here
                console.log(`Error: ${error}`);
                instance._docxHTML.set(`Failed to get file: ${error.message}`);
            } else {
                if (result.error) {
                    // Content validation errors, Mammoth failed to convert
                    instance._docxHTML.set(`Failed to convert:  ${result.message}`);
                } else {
                    instance._docxHTML.set(result);

                    // // Convert html string to Blob
                    // console.log('html blob: ', htmlToBlob(result));
                }
            }
        });
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
        instance._docxHTML.set(null);

        const url = instance._docxUrl.get();
        const validUrl = url && validateURL(url);
        const urlFileExt = url && validateDocxExt(url);

        if (!validUrl) {
            instance._docxHTML.set(`URL must be absolute and start with http:// or https://`);
            return;
        }

        if (urlFileExt !== 'docx') {
            instance._docxHTML.set(`Invalid file extension: ${urlFileExt}!`);
            return;
        }
        instance._getDocxFromUrl(url);
    },
    'input #docx-url-input': _.debounce((event, instance) => {
        instance._docxHTML.set(null);
        const url = event.target.value;

        instance._docxUrl.set(url);

    }, 300),
});
