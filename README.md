continue.js - JS Continuations Library
================================================

A library that is useful for splitting CPU heavy tasks into multiple slices, which are processed sequentially, leaving some time in between to avoid rendering the browser unresponsive.

How to use
====

Simply add the `continue.js` to your page

API
====

Basic API usage looks like this:
```javascript

// a continuation with 100 ms time in between slices
var c = new Continuation(100);
c.AddJob(function(timer) {
    // do some work - use timer() to check how many ms we have left 
    // in this time slice.
});

c.AddJob( ... do more work ...);

// schedule the continuation: by default this runs one slice of work 
// and offloads the rest (f any) to a later point in time. To get a 
// callback when the computation finishes, simply add it as a final job
// using  AddJob().
c.Schedule();
```
For more information, see the documentation in the source code.

Contributions
====

Are very welcome, just submit a PR on Github.
