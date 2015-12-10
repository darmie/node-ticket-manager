
(function(){
    var util = require('util'),
        http = require('http'),
        httpProxy = require('http-proxy');
    var childProcess = require('child_process');

    function runScript(scriptPath, callback) {

        // keep track of whether callback has been invoked to prevent multiple invocations
        var invoked = false;

        var process = childProcess.fork(scriptPath);

        // listen for errors as they may prevent the exit event from firing
        process.on('error', function (err) {
            if (invoked) return;
            invoked = true;
            callback(err);
        });

        // execute the callback once the process has finished running
        process.on('exit', function (code) {
            if (invoked) return;
            invoked = true;
            var err = code === 0 ? null : new Error('exit code ' + code);
            callback(err);
        });

    }

    httpProxy.createProxyServer({target:'http://localhost:9000'}).listen(8000);

    var  TicketManager = require("ticketman").TicketManager;
    var  TicketWorker = require("ticketman").TicketWorker;
    var ticketWorker = null;
    var mongoose = require('mongoose');
    var multer = require('multer');
    var express = require('express');
    var app = express();
    app.set('port', process.env.PORT || 3000);
    var bodyParser = require('body-parser')
    app.use( bodyParser.json() );       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: false
    }));
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET,POST');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    //app.use(multer);
// Now we can run a script and invoke a callback when complete, e.g.
    runScript('node_modules/ticketman/lib/server.js', function (err) {
        if (err){throw err;}else {

            console.log('finished running some-script.js');
        }
    });


    app.get('/ticket/new/:title/:category/:content', function (req, res) {
        //console.log(req.body);
        //res.send(req.params);
        var ticketManager = new TicketManager("test ticket_manager", "http://localhost:3456");

        ticketManager.issue(req.params.title, req.params.category, eval(req.params.content), function (err, ticket) {
           res.json(ticket);
            console.log(JSON.parse(ticket.content).message);
            res.end();
            console.log(err);

        });

    });

    app.listen(3000);
}).call(this);