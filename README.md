# task-queue-worker

A powerful tool for background processing of tasks that are run by making standard http requests.

The **task-queue-worker** is a NodeJS worker that monitors one or more message queues for tasks to run via http. Just like [Google App Engine Task queues](https://developers.google.com/appengine/docs/python/taskqueue/)

## Concept

The **task-queue-worker** should be run as a process on one or more machines and monitors a set of predefined message queues. It expects JSON  messages in a special format. At a minimum such message must contain an `url` key. The **task-queue-worker** then requests the URL and upon receiving a 2xx status code removes the message from the queue.

Please have a look at the message format for more details.

## Client

### Example

```
var TqwClient = require( "task-queue-worker" ).Client;
var client = new TqwClient( queue: "myqueuename" );
client.send( { "url": "http://some.domain.com/job/to/run" }, function( err ){
	// ...
});
```

> TODO

## Message format

Minimal working message:

```json
{
	"url": "http://some.domain.com/job/to/run"
}
```

This will result in a GET request to the above URL.  
If the status code of the reply is in the 2xx range the message will be removed from the queue.  
If the status code is not in the 2xx range the message will not be deleted and should pop up again after its invisibility timer runs out.

The following parameters let you control message handling of the **task-queue-worker**:

* `url` (string) **Required** Must be a valid URL.
* `method` (string) (Default: `GET`) Possible values: GET, DELETE, PUT, POST
* `body` (string) The body to send when the value of `method` is POST. If the value of body can be parsed as JSON the request will be sent with `application/json` as content-type. Otherwise with `appliction/x-www-form-urlencoded`. If `body` is used and no `method` has been defined automatically `POST` would be used.
* `delay` (number) (Default: 3) Defines the initial delay. If set to `0` the message will be processed imediately. Otherwise ist will wail for `n` seconds until it will be processed.
* `retrylimit` (number) (Default: 3) Setting this to -1 disables the retrylimit, leaving the message in the queue forever if it does not process successfully.
* `retrydelay` (number or array) If a number is supplied the visibility timeout of that message will be set to `retrydelay` seconds after an unsuccessful request. If an array is supplied (e.g. `[120,240,3600]`) the retry delay will increase gradually. See also the [changeMessageVisibility](https://github.com/smrchy/rsmq#changemessagevisibility) method of [rsmq](https://github.com/smrchy/rsmq)
* `maxts` (number) (Default: -1) A unix timestamp in seconds after which the message should not be processed anymore and will be deleted and handled as an error. A value of -1 disabled the maxts check.
* `timeout` (number) (Default: 10) Time in seconds to wait for a reply for this request. Must be between 1 and 3600.
* `failqueue` (string) The name of the queue where the message is moved after it did not process successfully. Either by reaching the `retrylimit` or the `maxts` value. If no `failqueue` is supplied the message will just be deleted.
* `maxredirects` (number) (Default: 10) The maximum number of redirects to follow. If `0` is set it will not follow HTTP 3xx responses and judge them as error.

**Defaults:** If the task-queue-worker is used as module you the defaults, expect `url` and `body` can be within the options

## Running task-queue-worker as process

The **task-queue-worker** will be started from the command line.

`node worker.js -k QueuesToMonitor`

Parameters:

* `-q, --queues`: (string) Comma separated list of queues to monitor (e.g. `-q alerts,jobs,uptimecheck`)
* `-k, -k???`: (string) Name of Redis **SET** that contains all queues to monitor (e.g. `-k tqm:QueuesToMonitor`). By using the -k parameter you can make sure that multiple task-queue-workers are using the same setting.
* `-t, --taskcount` (number) The amount of concurrent tasks the task-queue-worker will handle. (Default: 5)

**Note:** If `-q` or `-k` contains no queues or are not supplied the **tasks-queue-worker** will exit.

> eventually as `taskqueuewoker -k QueuesToMonitor` if installed globally.

## Using task-queue-worker as module

> TODO

### Example

```
var TQW = require( "task-queue-worker" )
var worker = new TQW.Worker()
worker.on( "error", function( err ){} )
worker.on( "success", function( response ){} )
```

### Events

* `error`

## Workflow

> TODO Diagram

1. Request a message until the number of `tasks` is reached.
2. If no message is received gradually increase the requests for the next message to 1,2,3,5 secconds and go to 1.
3. Process the message with the `timeout`. If the message returns a 2xx status code delete the message. And go to 1.
4. If the message cannot be requeued (see `retrylimit` and `maxts` parameters) delete it (and add it to the `failqueue` if supplied). Go to 1.
5.  If `retrydelay` is supplied modify the Message visibility ([changeMessageVisibility](https://github.com/smrchy/rsmq#changemessagevisibility))
6. Go to 1.


## Supported queues

Currently only [rsmq](https://github.com/smrchy/rsmq) is supported.  

Want to implement another message queue? Please send me a pull request and include some docs and tests.


## Release History

|Version|Date|Description|
|:--:|:--:|:--|
|v0.3.0|2014-10-13|Added message option `delay` + bugfixes and validations|
|v0.2.0|2014-09-22|Updated module to use the new basic class.|

## The MIT License (MIT)

Copyright © 2013 Patrick Liess, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

