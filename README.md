# task-queue-worker

A powerful tool for background processing of tasks that are run by making standard http requests.

The **task-queue-worker** is a NodeJS worker that monitors one or more message queues for tasks to run via http. Just like [Google App Engine Task queues](https://developers.google.com/appengine/docs/python/taskqueue/)

## Concept

The **task-queue-worker** should be run as a process on one or more machines and monitors a set of predefined message queues. It expects JSON  messages in a special format. At a minimum such message must contain an `url` key. The **task-queue-worker** then requests the URL and upon receiving a 2xx status code removes the message from the queue.

Please have a look at the message format for more details.


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
* `body` (string) The body to send when the value of `method` is POST. If the value of body can be parsed as JSON the request will be sent with `application/json` as content-type. Otherwise with `appliction/x-www-form-urlencoded`.
* `retrylimit` (number) (Default: 3) Setting this to -1 disables the retrylimit, leaving the message in the queue forever if it does not process successfully.
* `retrydelay` (number or array) If a number is supplied the visibility timeout of that message will be set to `retrydelay` seconds after an unsuccessful request. If an array is supplied (e.g. `[120,240,3600]`). . . . See also the [changeMessageVisibility](https://github.com/smrchy/rsmq#changemessagevisibility) method of [rsmq](https://github.com/smrchy/rsmq)
* `maxts` (number) (Default: -1) A unix timestamp in seconds after which the message should not be processed anymore and will be deleted and handled as an error. A value of -1 disabled the maxts check.
* `timeout` (number) (Default: 10) Time in seconds to wait for a reply for this request. Must be between 1 and 3600.
* `failqueue` (string) The name of the queue where the message is moved after it did not process successfully. Either by reaching the `retrylimit` or the `maxts` value. If no `failqueue` is supplied the message will just be deleted.



## Supported queues

Currently only [rsmq](https://github.com/smrchy/rsmq) is supported.  

Want to implement another message queue? Please send me a pull request and include some docs and tests.


## Changes

see the [CHANGELOG](https://github.com/smrchy/task-queue-worker/blob/master/CHANGELOG.md)

## The MIT License (MIT)

Copyright © 2013 Patrick Liess, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

