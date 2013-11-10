continue.js - JS Continuations Library
================================================

This is useful for splitting CPU heavy tasks into multiple slices, which are processed sequentially, leaving some time in between to avoid rendering the browser unresponsive. The user provides a a list of 'jobs', each of which should only do a part of the work. 

Assignment of jobs to time slices, and execution thereof is handled by the library then. Additionally, jobs get access to timing information (i.e. how much time is remaining in the current slice), allowing them to voluntarily yield and return another continuation job to be run in the next slice.

How to use
====

Simply add the `continue.js` file to your page. Minify at your leisure.

API
====

Basic API usage looks like this:
```javascript

// a continuation with 100 ms time in between slices
var c = new Continuation(100);
c.add(function(timer) {
    // do some work - use timer() to check how many ms we have left 
    // in this time slice. If you decide you don't have enough time
    // left, return a continuation function that finishes the job
    // up. This continuation function will be the next job called,
    // before any other jobs added via add() run.
});

c.add( /* ... do more work ...*/ );

// schedule the continuation: by default this runs one slice of work 
// and offloads the rest (if any) to a later point in time. 
c.schedule();
```
For more information, see the API documentation in the source code.

Contributions
====

Are very welcome, just submit a PR on Github.
