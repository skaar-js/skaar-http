import {Ajax} from "./ajax";
import {HttpContent} from "./request";


/**
 * A factory for {@link Ajax}
 * @private
 * @param {HttpMethod} method - {@link HttpMethod}
 * @param {String} url
 * @param {Object} params
 * @param {Object} headers
 * @param {HttpContent} content
 * @param {{success, fail, progress, prepare, uploadProgress, uploadFinish}} callbacks
 * @return {Ajax}
 */
export function makeHttpRequest(method, url, params, headers, content, callbacks) {
    let ajax = new Ajax(method.toUpperCase(), url, params, headers);
    if (content && content.type) {
        if (content.type.toLowerCase() === 'json') {
            ajax.jsonData(content.data);
        } else if (content.type.toLowerCase() === 'urlencoded') {
            ajax.urlEncodedData(content.data);
        } else if (content.type.toLowerCase() === 'form') {
            ajax.formData(content.data);
        } else {
            ajax.Rq.setContent(content.type, content.data);
        }
    }
    callbacks.success && ajax.onSuccess(callbacks.success);
    callbacks.fail && ajax.onFail(callbacks.fail);
    callbacks.progress && ajax.onProgress(callbacks.progress);
    callbacks.prepare && (ajax.preparedCallback = callbacks.prepare);
    callbacks.uploadProgress && (ajax.uploadProgressCallback = callbacks.uploadProgress);
    callbacks.uploadFinish && (ajax.uploadFinishCallback = callbacks.uploadFinish);
    return ajax;
}

//{method, url, args, headers, type, data, success, fail, progress, prepare, uploadProgress, uploadFinish}
/**
 * A factory for {@link Ajax}. creates Ajax request with supplied {@link HttpRequestOptions}
 *
 * @param {HttpRequestOptions} opts
 * @return {Ajax}
 */
export function makeRequest(opts) {
    return makeHttpRequest(opts.method || 'OPTIONS', opts.url, opts.params, opts.headers, new HttpContent(opts.type, opts.data), {
        success: opts.success,
        fail: opts.fail,
        progress: opts.progress,
        prepare: opts.prepare,
        uploadProgress: opts.uploadProgress,
        uploadFinish: opts.uploadFinish
    })
}

/**
 * @private
 * @param {Ajax} ajax - Ajax request
 * @param {Object} callbacks - ajax event listeners
 * @param {any} extra - passed to callbacks
 * @returns {Promise<Ajax>}
 */
export function makePromise(ajax, callbacks={}, extra={}) {
    return new Promise((resolve, reject) => {
        ajax.onSuccess(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra)
            }
            let callback = callbacks.onSuccess
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else resolve(ajax)
        });
        ajax.onFail(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra)
            }
            let callback = callbacks.onFail
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else reject(ajax)
        });
        ajax.onAbort(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra)
            }
            let callback = callbacks.onAbort
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else reject(ajax)
        })

        ajax.onTimeout(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra)
            }
            let callback = callbacks.onTimeout
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else reject(ajax)
        })
    })
}

/**
 * Send request asynchronously
 *
 * @param {HttpRequestOptions} opts
 * @return {Promise<any>}
 */
export async function sendRequest(opts) {
    let r = makeRequest(opts);
    r.send();
    return await makePromise(r);
}

/**
 * Create Ajax GET request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 * @returns {Ajax}
 */
export function Get(url, params){
    return new Ajax('GET', url, params);
}

/**
 * Create Ajax POST request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 */
export function Post(url, params){
    return new Ajax('POST', url, params);
}

/**
 * Create Ajax DELETE request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 * @returns {Ajax}
 */
export function Delete(url, params){
    return new Ajax('DELETE', url, params);
}

/**
 * Create Ajax PUT request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 * @returns {Ajax}
 */
export function Put(url, params){
    return new Ajax('PUT', url, params);
}

/**
 * Create Ajax PATCH request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 * @returns {Ajax}
 */
export function Patch(url, params){
    return new Ajax('PATCH', url, params);
}

/**
 * Create and send GET request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
export function sendGet(opt) {
    opt.method = 'GET';
    opt.type = undefined;
    opt.data = undefined;
    return sendRequest(opt)
}

/**
 * Create and send DELETE request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
export function sendDelete(opt) {
    opt.method = 'DELETE';
    return sendRequest(opt)
}

/**
 * Create and send POST request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
export function sendPost(opt) {
    opt.method = 'POST';
    return sendRequest(opt)
}

/**
 * Create and send PUT request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
export function sendPut(opt) {
    opt.method = 'PUT';
    return sendRequest(opt)
}

/**
 * Create and send PATCH request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
export function sendPatch(opt) {
    opt.method = 'PATCH';
    return sendRequest(opt)
}

/**
 * @typedef {Object} HttpRequestOptions - Http request arguments
 * @property {HttpMethod} [method]
 * @property {String} [url]
 * @property {Object} [params]
 * @property {Object} [headers]
 * @property {string} [type] - request type "json"|"xml"|"array-buffer"|"blob"|undefined
 * @property {any} [data] - request content data
 * @property {Function} [success] - success callback
 * @property {Function} [fail] - fail callback
 * @property {Function} [progress] - progress callback
 * @property {Function} [prepare] - prepare callback, called before send
 * @property {Function} [uploadProgress] - upload progress callback
 * @property {Function} [uploadFinish] - upload finish callback
 */