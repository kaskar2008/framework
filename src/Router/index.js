let HttpHash = require('http-hash');

class Router {
    constructor() {
        this.GETRoutes = HttpHash();
        this.POSTRoutes = HttpHash();
        this.PUTRoutes = HttpHash();
        this.DELETERoutes = HttpHash();
        this.routesList = [];
    }

    /**
     * Creates a binding for a new route.
     *
     * @param method
     * @param routeUrl
     * @param binding
     * @param options
     */
    _registerRoute(method, routeUrl, binding, options) {
        this[method + 'Routes'].set(routeUrl, { closure: binding, options: options});
        this.routesList.push({ method: method, path: routeUrl, options: options });
    }

    /**
     * Creates a get route.
     *
     * @param routeUrl
     * @param binding
     * @param options
     * @return {*}
     */
    get(routeUrl, binding, options) {
        return this._registerRoute('GET', routeUrl, binding, options);
    }

    /**
     * Creates a post route.
     *
     * @param routeUrl
     * @param binding
     * @param options
     * @return {*}
     */
    post(routeUrl, binding, options) {
        return this._registerRoute('POST', routeUrl, binding, options);
    }

    /**
     * Creates a put route.
     *
     * @param routeUrl
     * @param binding
     * @param options
     * @return {*}
     */
    put(routeUrl, binding, options) {
        return this._registerRoute('PUT', routeUrl, binding, options);
    }

    /**
     * Creates a delete route.
     *
     * @param routeUrl
     * @param binding
     * @param options
     * @return {*}
     */
    delete(routeUrl, binding, options) {
        return this._registerRoute('DELETE', routeUrl, binding, options);
    }

    /**
     * Resolve a given route.
     *
     * @param httpMethod
     * @param routeUrl
     * @param response
     */
    resolveRoute(httpMethod, routeUrl, response) {
        let route = this.findMatchingRoute(httpMethod, routeUrl);

        if (route.handler)
            return Router.goThroughMiddleware(route, response);

        response.writeHead(404);
        return response.end('Route not found');
    }

    /**
     * Find the matching route.
     *
     * @param method
     * @param route
     */
    findMatchingRoute(method, route) {
        return this[method + 'Routes'].get(route);
    }

    /**
     * Pipe data through the middlewares.
     *
     * @param route
     * @param response
     * @return {*}
     */
    static goThroughMiddleware(route, response) {
        if (route.handler.options && route.handler.options.middleware) {
            let middlewareContainer = use('Ivy/MiddlewareContainer'),
                Pipe = use('Ivy/Pipe');

            let middlewaresList = middlewareContainer.parse(route.handler.options.middleware);

            return Pipe.data({ route: route, response: response })
                .through(middlewaresList)
                .catch((err) => {
                    console.error(err);
                    response.writeHead(500);
                    return response.end('Error piping through middleware. ' + err);
                }).then((data) => {
                    return Router.dispatchRoute(data.route, data.response);
                });
        }

        return Router.dispatchRoute(route, response);
    }

    /**
     * Dispatch a request to the handler.
     *
     * @param route
     * @param response
     * @return {*}
     */
    static dispatchRoute(route, response) {
        let handlerResponse = route.handler.closure(route.params);
        return Router.respondToRoute(handlerResponse, response);
    }

    /**
     * Make a response to the request.
     *
     * @param handlerAnswer
     * @param response
     * @return {*}
     */
    static respondToRoute(handlerAnswer, response) {
        if (typeof handlerAnswer === "string")
            return response.end(handlerAnswer);

        if (handlerAnswer['toString'] && typeof handlerAnswer !== 'object')
            return response.end(handlerAnswer.toString());

        try {
            response.setHeader('content-type', 'application/json');
            return response.end(JSON.stringify(handlerAnswer, null, 4));
        } catch(e) {
            console.error('Error while trying to stringify JSON object.');
            console.error(e);
            response.writeHead(500);
            return response.end('Server error.');
        }
    }
}

module.exports = Router;