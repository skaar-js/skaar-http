'use strict';

/**
 * If is class or function return class/function name else returns typeof
 * @param x
 * @return {"undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint"|*}
 */

/** Is value !null && !undefined
 * @param x
 * @return {boolean}
 */
function isVal(x) {
    return x != null
}

/** Is string|String
 * @param x
 * @return {boolean}
 */
function isStr(x) {
    return typeof x === "string" || x instanceof String;
}

/** Is function
 * @param x
 * @return {boolean}
 */
function isFun(x) {
    return typeof x === "function";
}

/** Is object
 * @param x
 * @return {boolean}
 */
function isObj(x) {
    return x !== null && typeof x === "object";
}

/** Is Element/Node
 * @param x
 * @return {boolean}
 */
function isEl(x) {
    return x instanceof Element || x instanceof HTMLElement || x instanceof Node;
}

/**
 * Object has field
 * @param {Object} obj - source object
 * @param {String} field - field/property name
 * @param {Function} [pred] - optional predicate function to check field
 * @return {boolean}
 */
function hasField(obj, field, pred) {
    return isVal(obj)?(isFun(pred)?pred(obj[field]):obj.hasOwnProperty(field)):false;
}

/** Is Empty Array/List/Object/String
 * @param x
 * @return {boolean}
 */
function isEmpty(x) {
    return !hasField(x, 'length') ? !isFun(x) ? !isObj(x) ? true : Object.keys(x).length <= 0 : false : x.length <= 0;
}

/**
 * forEach on object keys - Object.keys()
 *
 * @param {Object} obj - source object
 * @param {function(value: any, key: String, index: Number)} fn - loop function
 */
function forEachKey(obj, fn) {
    if (typeof obj !== "object") throw TypeError('forEachKey: first argument must be object');
    const ps = Object.keys(obj);
    const len = ps.length;
    for (let i = 0; i < len; i++) {
        const k = ps[i];
        const v = obj[k];
        fn(v, k, i);
    }
}

/**
 * @typedef {"GET"|"POST"|"PUT"|"DELETE"|"PATCH"|"OPTIONS"} HttpMethod
 */

/**
 * Http Content class
 */
class HttpContent{
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
class HttpRq{
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

/**
 * Http Response class
 * @property json {Object}
 * @property xml {XMLDocument}
 *
 */
class HttpRs {
    /**
     * @constructor
     * @param {XMLHttpRequest} xhr
     */
    constructor(xhr) {
        this.xhr = xhr;
        this.status = {
            code: xhr.status,
            text: xhr.statusText
        };
        this.headers = xhr.getAllResponseHeaders();
        this.contentLength = xhr.response.length || 0;
        this.data = xhr.response;
        this.json = undefined;
        this.xml = undefined;
        if (xhr.responseType === 'text' || xhr.responseType === '')
            this.text = xhr.responseText;
        Object.defineProperty(this, 'json', {
            get() {
                try {
                    if (!xhr.responseJSON) {
                        xhr.responseJSON = JSON.parse(this.xhr.responseText);
                    }
                } catch (e) {
                    console.error(e);
                }
                return xhr.responseJSON
            }
        });

        Object.defineProperty(this, 'xml', {
            get() {
                try {
                    if (!xhr.responseXML && !xhr.responseXml) {
                        let parser = new DOMParser();
                            xhr.responseXml = parser.parseFromString(self.text,"text/xml");
                    }
                }catch (e) {
                    console.error(e);
                }

                return xhr.responseXml;
            }
        });
    }

}

/**
 * A wrapper class for {@link XMLHttpRequest} to facilitate sending requests and handling events
 * @class
 * @property {Response} rs
 * @property {Request} rq
 */
class Ajax {
    /**
     * @constructor
     * @param {HttpMethod|HttpRq} m - Request method string or {@link HttpRq}
     * @param {String} [url]
     * @param {Object} [params] - Request parameters object
     * @param {Object?} [headers] - Headers object
     * @param {HttpContent?} [content] - Optional http content {@link HttpContent}
     */
    constructor(m, url, params = {}, headers = {}, content = new HttpContent()) {
        /** @type {HttpRq}
         * @see {HttpRq}
         */
        this.rq = {};
        /** @type {HttpRs}
         * @see {HttpRs}
         */
        this.rs = {};
        if (m instanceof HttpRq) {
            this.rq = m;
        } else {
            this.rq = new HttpRq(m, url, params, headers, content);
        }
        // Fields
        this.rs = {readyState: 0};
        this.xhr = new XMLHttpRequest();

        this.preparedCallback = function (ajax) {
        };

        this.progressCallback = function (ajax, event) {
        };

        this.uploadProgressCallback = function (ajax, event) {
        };

        this.successCallback = function (ajax) {
        };

        this.uploadFinishCallback = function (ajax) {
        };

        this.failCallback = function (ajax, error) {
        };

        this.timeoutCallback = function (ajax) {
        };

        this.abortCallback = function (ajax) {
        };
        Object.defineProperty(this, 'xhr', {enumerable: false});
    }

    // Methods
    /**
     * Set header
     * @param {String} n - header name
     * @param {String} [v] - header value
     * @returns {Ajax}
     */
    header(n, v) {
        this.rq.setHeader(n, v);
        return this;
    };

    /**
     * Add/Set headers
     * @param {Object} hdrs - headers object
     * @returns {Ajax}
     */
    headers(hdrs = {}) {
        forEachKey(hdrs, function (v, k) {
            this.rq.setHeader(k, v);
        });
        return this;
    };

    /**
     * @param {Function} callback
     * @returns {Ajax}
     */
    onSuccess(callback) {
        this.successCallback = callback;
        return this;
    };

    /**
     * @param {Function} callback
     * @returns {Ajax}
     */
    onUploadSuccess(callback) {
        this.uploadFinishCallback = callback;
        return this;
    };

    /**
     * @param {Function} callback
     * @returns {Ajax}
     */
    onFail(callback) {
        this.failCallback = callback;
        return this;
    };

    onTimeout(callback) {
        this.timeoutCallback = callback;
        return this;
    }

    onAbort(callback) {
        this.abortCallback = callback;
        return this;
    }

    /**
     * @param {Function} callback
     * @returns {Ajax}
     */
    onProgress(callback) {
        this.progressCallback = callback;
        return this;
    };

    /**
     * @param {Function} callback
     * @returns {Ajax}
     */
    onUploadProgress(callback) {
        this.uploadProgressCallback = callback;
        return this;
    };

    /**
     * Set custom content {@link HttpContent}
     * @param {HttpContent} content
     * @returns {Ajax}
     */
    withContent(content = {}) {
        switch (content.type) {
            case 'json':
                this.rq.jsonContent(content.data);
                break;
            case 'xml':
                this.rq.xmlContent(content.data);
                break;
            case 'form':
                this.rq.formContent(content.data);
                break;
            case 'form_multipart':
                this.rq.formMultiPartContent(content.data);
                break;
            case 'form_urlencoded':
                this.rq.formUrlEncodedContent(content.data);
                break;
            default:
                this.rq.setContent(content.type, content.data);
        }
        return this;
    }

    /**
     * Set xml request data
     * @param {XMLDocument} data
     * @returns {Ajax}
     */
    xmlData(data) {
        this.rq.xmlContent(data);
        return this;
    }

    /**
     * Set form-data request data
     * @param {String|Node|Element} form
     * @returns {Ajax}
     */
    formData(form) {
        this.rq.formContent(form);
        return this;
    };

    /**
     * Set json request data
     * @param {String|Object} data
     * @returns {Ajax}
     */
    jsonData(data) {
        this.rq.jsonContent(data);
        return this;
    };

    /**
     * Set url-encoded request data
     * @param {Object} data - simple data object
     * @returns {Ajax}
     */
    urlEncodedData(data) {
        this.rq.formUrlEncodedContent(data);
        return this;
    };

    prepare(reset) {
        if (this.isPrepared && !reset) {
            // self.onprepare && self.onprepare(self.rq);
            return this
        }

        // prepare url
        let url = this.rq.url;

        if (this.rq.args && !isEmpty(this.rq.args)) {
            url.indexOf('?') >= 0 || (url += '?');
            url += this.rq.buildUrlEncoded();
        }
        this.rs = {readyState: 0};
        reset && (this.xhr = new XMLHttpRequest());
        this.xhr.open(this.rq.method, url);

        // prepare headers
        forEachKey(this.rq.headers, function (val, key){
            try {
                this.xhr.setRequestHeader(key, this.rq.headers[val]);
            } catch (e){
                console.error('Error while setting default header \n>>(',key,')<< Non-standard header name.');
            }
        }.bind(this));

        let ajax = this;
        let xhr = this.xhr;

        this.xhr.onreadystatechange = function (ev) {
            // onloadend
            if (xhr.readyState === 4 && xhr.status !== 0) {
                let callback = ajax.failCallback;
                if (xhr.status >= 200 && xhr.status <= 399) {
                    callback = ajax.successCallback;
                }
                ajax.rs = new HttpRs(xhr);
                callback && callback(ajax, ev);
            }
        };

        this.xhr.onerror = function (ev) {
            ajax.failCallback && ajax.failCallback(ajax, ev);
        };

        this.xhr.onprogress = function (ev) {
            ajax.progressCallback && ajax.progressCallback(ajax, ev);
        };

        this.xhr.upload.onprogress = function (ev) {
            ajax.uploadProgressCallback && ajax.uploadProgressCallback(ajax, ev);
        };

        this.xhr.upload.onloadend = function (ev) {
            ajax.uploadFinishCallback && ajax.uploadFinishCallback(ajax, ev);
        };

        this.xhr.ontimeout = function (ev) {
            ajax.timeoutCallback && ajax.timeoutCallback(ajax, ev);
        };

        this.xhr.onabort = function (ev) {
            ajax.abortCallback && ajax.abortCallback(ajax, ev);
        };

        this.isPrepared = true;
        this.preparedCallback && this.preparedCallback(this.rq);
        // preparedCallback && preparedCallback();
        return this;
    };

    /**
     * Send XHR request
     * @returns {Ajax}
     */
    send() {
        this.prepare();

        try {
            this.xhr.send(this.rq.content.data);
        } catch (e) {
            this.failCallback(this, e);
        }

        return this;
    }

    resend() {
        return this.prepare(true).send();
    }

    /**
     * Send request with Promise
     * @return {Promise<Ajax>}
     */
    async sendAsync() {
        const ajax = this;
        const promise = new Promise((res, rej) => {
            ajax.onSuccess(() => {
                return res(ajax)
            });
            ajax.onFail(() => {
                rej(ajax);
            });
        });
        ajax.send();
        return promise;
    }
}

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
function makeHttpRequest(method, url, params, headers, content, callbacks) {
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
function makeRequest(opts) {
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
function makePromise(ajax, callbacks={}, extra={}) {
    return new Promise((resolve, reject) => {
        ajax.onSuccess(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra);
            }
            let callback = callbacks.onSuccess;
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else resolve(ajax);
        });
        ajax.onFail(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra);
            }
            let callback = callbacks.onFail;
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else reject(ajax);
        });
        ajax.onAbort(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra);
            }
            let callback = callbacks.onAbort;
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else reject(ajax);
        });

        ajax.onTimeout(async ()=>{
            if (callbacks.default) {
                callbacks.default(ajax, resolve, reject, extra);
            }
            let callback = callbacks.onTimeout;
            if (callback)
                try {
                    callback(ajax, resolve, reject, extra);
                } catch (e) {}
            else reject(ajax);
        });
    })
}

/**
 * Send request asynchronously
 *
 * @param {HttpRequestOptions} opts
 * @return {Promise<any>}
 */
async function sendRequest(opts) {
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
function Get(url, params){
    return new Ajax('GET', url, params);
}

/**
 * Create Ajax POST request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 */
function Post(url, params){
    return new Ajax('POST', url, params);
}

/**
 * Create Ajax DELETE request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 * @returns {Ajax}
 */
function Delete(url, params){
    return new Ajax('DELETE', url, params);
}

/**
 * Create Ajax PUT request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 * @returns {Ajax}
 */
function Put(url, params){
    return new Ajax('PUT', url, params);
}

/**
 * Create Ajax PATCH request
 *
 * @param {String} url - server url
 * @param {Object} [params] - query string params
 * @returns {Ajax}
 */
function Patch(url, params){
    return new Ajax('PATCH', url, params);
}

/**
 * Create and send GET request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
function sendGet(opt) {
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
function sendDelete(opt) {
    opt.method = 'DELETE';
    return sendRequest(opt)
}

/**
 * Create and send POST request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
function sendPost(opt) {
    opt.method = 'POST';
    return sendRequest(opt)
}

/**
 * Create and send PUT request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
function sendPut(opt) {
    opt.method = 'PUT';
    return sendRequest(opt)
}

/**
 * Create and send PATCH request
 *
 * @param {HttpRequestOptions} opt
 * @return {Promise<Ajax>}
 */
function sendPatch(opt) {
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

class InterceptorStore {
    constructor() {
        this.all = [];
        this.any = false;
    }

    use(interceptor) {
        this.all.push(interceptor);
        this.any = true;
    }

    async intercept(ajax) {
        for (let i = 0; i < this.all.length; i++) {
            ajax = await this.all[i](ajax);
        }
        return ajax
    }
}

/**
 * Async Http Client using XHR
 * @class
 */
class HttpClient {
    /**
     *
     * @param {String} host - Server host address
     * @param {Number} [ratePerMinute] - Maximum requests allowed per minute (default 300)
     * @param {Object} [defaultParams] - Default params set on every request
     * @param {Object} [defaultHeaders] - Default headers set on every request
     * @param {Number} [timeout=3000]
     * @param {Number} [retries]
     */
    constructor(host = '', {
        ratePerMinute = 300,
        defaultParams,
        defaultHeaders,
        timeout, retries
    } = {}) {
        if (host[host.length-1] === '/') {
            host = host.split('').splice(host.length - 1).join();
        }
        /**
         * Interceptors
         * @type {{request: InterceptorStore, response: InterceptorStore}}
         */
        this.interceptors = {
            request: new InterceptorStore(),
            response: new InterceptorStore()
        };
        this.host = host;
        this.__queue = [];
        this.__sending = [];
        this.__interval = undefined;
        this.__ratePerMinute = ratePerMinute;
        this.__timeBetween = 60000 / ratePerMinute;
        this.__lastRequestTime = new Date().getTime() - this.__timeBetween;
        this.timeout = timeout || 60000;
        this.retries = retries || 0;
        this.defaultHeaders = defaultHeaders || {};
        this.defaultParams = defaultParams || {};
    }

    /**
     *
     * @param client
     * @private
     */
    _intervalSend(client) {
        if (client.__queue.length === 0) {
            clearInterval(client.__interval);
            client.__interval = undefined;
            return;
        }
        let now = new Date().getTime();
        if (now - client.__lastRequestTime > client.__timeBetween) {
            let ajax = client.__queue.shift();
            client._sendImmediately(ajax, now);
        }
    }

    _sendImmediately(ajax, now) {
        if (this.interceptors.request.any) {
            this.interceptors.request.intercept(ajax).then(() => {
                ajax.send();
                this.__sending.push(ajax);
                this.__lastRequestTime = now;
            }).catch((e) => {
                console.error(e);
            });
        } else {
            ajax.send();
            this.__sending.push(ajax);
            this.__lastRequestTime = now;
        }
    }

    _removeSendingRequest(request) {
        let rqi = this.__sending.indexOf(request);
        if (rqi >= 0) {
            this.__sending.splice(rqi);
        }
    }

    /**
     *
     * @param ajax
     * @param responseType
     * @param cancelToken
     * @return {Promise<Ajax>}
     * @private
     */
    _addRequest(ajax, {responseType, cancelToken}) {
        this.__queue.push(ajax);
        if (!this.__interval) {
            this.__interval = setInterval(this._intervalSend, 1, this);
        }
        ajax.cancelToken = cancelToken;
        if (responseType) ajax.xhr.responseType = responseType;
        ajax.RETRIES = 0;
        ajax.xhr.timeout = this.timeout;
        if (this.defaultHeaders) {
            ajax.headers(this.defaultHeaders);
        }
        if (this.defaultParams) {
            forEachKey(this.defaultParams, (val, key) => {
                ajax.rq.setArg(key, val);
            });
        }
        let promise = makePromise(ajax, {
            default(ajax, res, rej, client) {
                client._removeSendingRequest(ajax);
            },
            onSuccess(ajax, res, rej, client) {
                if (client.interceptors.response.any) {
                    client.interceptors.response.intercept(ajax)
                        .then(() => res(ajax))
                        .catch((e) => rej(e));
                } else res(ajax);
            },
            onFail(ajax, res, rej, client) {
                if (client.interceptors.response.any) {
                    client.interceptors.response.intercept(ajax)
                        .then(() => rej(ajax))
                        .catch((ajax, err) => rej(ajax, err));
                } else rej(ajax);
                return rej(ajax, Error('Request failed.'))
            },
            onTimeout(ajax, res, rej, client) {
                if (ajax.RETRIES >= client.retries) {
                    return rej(ajax, Error('Request timed out after ' + ajax.RETRIES + ' retries.'))
                }
                client.__sending.push(ajax.resend());
                ajax.RETRIES += 1;
            }
        }, this);
        ajax._promise_ = promise;
        return promise
    }

    /**
     * Add ajax request to queue
     * @param {Ajax} ajax
     */
    send(ajax) {
        return this._addRequest(ajax)
    }

    /**
     *
     * @param method
     * @param route
     * @param params
     * @param headers
     * @param content
     * @param responseType
     * @param cancelToken
     * @return {Promise<Ajax>}
     * @private
     */
    _contentRequest(method, route, {params, headers, content, responseType, cancelToken}) {
        if (!(route[0] === '/') && route.length > 1) {
            route = '/' + route;
        }
        return this._addRequest(
            method(this.host + route, params || {})
                .headers(headers || {})
                .withContent(content || {type: '', data: ''})
            , {responseType, cancelToken})
    }

    /**
     * Enqueue http GET request
     *
     * @param {String} route - request route - appends to host address
     * @param {Object} [params] - request params(args)
     * @param {Object} [headers] - request headers
     * @param {String} [responseType] - "text"|"json"|"xml"|"document"|"arraybuffer"|"blob"|"ms-stream"|""
     * @param {String} [cancelToken] - A token used to cancel a group of requests
     * @return {Promise<Ajax>}
     */
    get(route, {params, headers, responseType, cancelToken} = {}) {
        if (!(route[0] === '/') && route.length > 1) {
            route = '/' + route;
        }
        return this._addRequest(Get(this.host + route, params).headers(headers), {responseType, cancelToken});
    }

    /**
     * Enqueue http POST request
     *
     * @param {String} route - request route - appends to host address
     * @param {Object} [params] - request params(args)
     * @param {Object} [headers] - request headers
     * @param {HttpContent|Object} [content] - request content. example: {type:'json', data={count: 13}}
     * @param {String} [responseType] - "text"|"json"|"xml"|"document"|"arraybuffer"|"blob"|"ms-stream"|""
     * @param {String} [cancelToken] - A token used to cancel a group of requests
     * @return {Promise<Ajax>}
     */
    post(route, {params, headers, content, responseType, cancelToken} = {}) {
        return this._contentRequest(Post, route, {params, headers, content, responseType, cancelToken});
    }

    /**
     * Enqueue http PUT request
     *
     * @param {String} route - request route - appends to host address
     * @param {Object} [params] - request params(args)
     * @param {Object} [headers] - request headers
     * @param {HttpContent} [content] - request content. example: {type:'json', data={count: 13}}
     * @param {String} [responseType] - "text"|"json"|"xml"|"document"|"arraybuffer"|"blob"|"ms-stream"|""
     * @param {String} [cancelToken] - A token used to cancel a group of requests
     * @return {Promise<Ajax>}
     */
    put(route, {params, headers, content, responseType, cancelToken} = {}) {
        return this._contentRequest(Put, route, {params, headers, content, responseType, cancelToken});
    }

    /**
     * Enqueue http PATCH request
     *
     * @param {String} route - request route - appends to host address
     * @param {Object} [params] - request params(args)
     * @param {Object} [headers] - request headers
     * @param {HttpContent} [content] - request content. example: {type:'json', data={count: 13}}
     * @param {String} [responseType] - "text"|"json"|"xml"|"document"|"arraybuffer"|"blob"|"ms-stream"|""
     * @param {String} [cancelToken] - A token used to cancel a group of requests
     * @return {Promise<Ajax>}
     */
    patch(route, {params, headers, content, responseType, cancelToken} = {}) {
        return this._contentRequest(Patch, route, {params, headers, content, responseType, cancelToken});
    }

    /**
     * Enqueue http DELETE request
     *
     * @param {String} route - request route - appends to host address
     * @param {Object} [params] - request params(args)
     * @param {Object} [headers] - request headers
     * @param {HttpContent} [content] - request content. example: {type:'json', data={count: 13}}
     * @param {String} [responseType] - "text"|"json"|"xml"|"document"|"arraybuffer"|"blob"|"ms-stream"|""
     * @param {String} [cancelToken] - A token used to cancel a group of requests
     * @return {Promise<Ajax>}
     */
    delete(route, {params, headers, content, responseType, cancelToken} = {}) {
        return this._contentRequest(Delete, route, {params, headers, content, responseType, cancelToken});
    }

    /**
     * Cancel all requests(sending or enqueued) with given token
     * @param {String} token
     */
    cancel(token) {
        this.__queue = this.__queue.filter((a) => a.cancelToken !== token);
        let sending = this.__sending.filter((a) => a.cancelToken === token);

        sending.forEach(function (ajax) {
            try {
                ajax.xhr.abort();
            } catch (e) {
                console.error(e);
            }
        });

        this.__sending = this.__sending.filter((a) => a.cancelToken !== token);
    }

    cancelAll() {
        if (this.__interval >= 0) clearInterval(this.__interval);
        setTimeout(()=>{
            this.__sending.forEach(function (a) {
                try {
                    a.xhr.abort();
                } catch (e) {
                }
            });
            this.__queue = [];
        }, 1);
    }
}

module.exports = {
    Ajax,
    HttpClient,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    sendGet,
    sendPost,
    sendPut,
    sendDelete,
    sendPatch,
    sendRequest,
    makeHttpRequest,
    makeRequest,
    makePromise
};
