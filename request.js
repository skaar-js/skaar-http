/**
 * @typedef {"GET"|"POST"|"PUT"|"DELETE"|"PATCH"|"OPTIONS"} HttpMethod
 */

import {isStr} from "@skaar/core/type";
import {isEl} from "@skaar/core/type";

/**
 * Http Content class
 */
export class HttpContent{
    constructor(type, data) {
        /**
         * @type {string}
         */
        this.type = type;
        /**
         * @type {any}
         */
        this.data = data;
    }
}

/**
 * Http request class
 * @class
 */
export class HttpRq{
    /**
     * @param {HttpMethod} m
     */
    setMethod(m) {
        this.method = m.toUpperCase();
    };

    /**
     * @param {string} u
     */
    setUrl(u) {
        this.url = encodeURI(u);
    };

    /**
     * Set request param/arg
     * @param {string} n - name
     * @param {string} v - value
     */
    setArg(n, v) {
        this.args[n] = v;
    };

    buildUrlEncoded(args) {
        let ue = "";
        args = args || this.args;

        let argNames = Object.keys(args);
        if (argNames.length>0) {
            for (let i = 0; i < argNames.length; i++) {
                ue += encodeURIComponent(argNames[i]) + '=' + encodeURIComponent(args[argNames[i]]);
                if (i < argNames.length - 1) {
                    ue += '&';
                }
            }
        }
        return ue;
    };

    /**
     * Set request header
     * @param {string} n - name
     * @param {string} v - value
     */
    setHeader(n, v) {
        this.headers[n] = v.toString();
    };

    /**
     * Get request header
     * @param {string} n - name
     */
    getHeader(n) {
        return this.headers[n];
    };

    /**
     * Set request content
     * @param {string} contentType
     * @param {any} data
     */
    setContent(contentType, data) {
        this.content.type = contentType.toLowerCase();
        this.content.data = data;
    };

    /**
     * Set request json content
     * @param {string|Object} data
     */
    jsonContent(data) {
        let str;
        if (typeof data === "string") {
            str = data;
        } else {
            str = JSON.stringify(data);
        }
        this.setContent('json', str);
        this.setHeader('Content-Type', 'application/json');
    };

    /**
     * Set request xml content
     * @param {string|Node|Element} data
     */
    xmlContent(data) {
        if (isStr(data))
            this.setContent('xml', data);
        else this.setContent('xml', data.outerHTML);
        this.setHeader('Content-Type', 'application/xml');
    };
    /**
     * Set request multipart data from Form element
     * @param {string|Node|Element} form - form element/id
     */
    formContent(form) {
        let formElement = isEl(form)?form:document.querySelector(form);
        let frm = new FormData(formElement);
        this.formMultiPartContent(frm);
    };

    /**
     * Set request multipart data from FormData object
     * @param {FormData} frm - custom form data object
     */
    formMultiPartContent(frm) {
        this.setContent('form_multipart', frm);
        // this.setHeader('Content-Type', 'multipart/form-data; boundary=' + frm.boundary)
    };

    /**
     * Set request data as urlencoded
     * @param {Object} data
     */
    formUrlEncodedContent(data) {
        this.setContent('form_urlencoded', this.buildUrlEncoded(data));
        this.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    };

    /**
     *
     * @param {HttpMethod} method
     * @param {string} url
     * @param {Object} args
     * @param {Object} headers
     * @param {HttpContent} content
     */
    constructor(method='GET', url, args, headers, content) {
        this.args = args || {};
        this.headers = headers || {};
        this.content = content || new HttpContent('#urlencoded', {});

        this.setMethod(method);

        this.setUrl(url);
    }

}