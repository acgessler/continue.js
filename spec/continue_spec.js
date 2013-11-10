

describe('continue', function() {
	var SLICE_SIZE = 50
	,	cont;

	beforeEach(function() {
		cont = new Continuation();
	});

	afterEach(function() {
		expect(cont.running()).toBeFalsy();
		expect(cont.finished()).toBeTruthy();
	})
	

	it("should have no completion callback initially, but be able to set one", function () {
		var f = function() {}
		;

		expect(cont.on_finished()).toBe(null);
		cont.on_finished(f);
		expect(cont.on_finished()).toBe(f);
		cont.schedule();
	});

	it("running with no jobs immediately finishes", function () {
		cont.on_finished(function() {
			expect(cont.running()).toBeFalsy();
			expect(cont.finished()).toBeTruthy();
		});
		cont.schedule();
	});

	it("running with no jobs immediately finishes even in async mode", function () {
		cont.on_finished(function() {
			expect(cont.running()).toBeFalsy();
			expect(cont.finished()).toBeTruthy();
		});
		cont.schedule(SLICE_SIZE, true);
	});

	it("should be able to create a continuation with two jobs and run it immediately", function () {
		var c = 0
		;
		cont.add(function() {
			expect(cont.running()).toBeTruthy();
			expect(cont.finished()).toBeFalsy();
			++c;
		});
		cont.add(function() {
			expect(cont.running()).toBeTruthy();
			expect(cont.finished()).toBeFalsy();
			++c;
		});

		expect(cont.running()).toBeFalsy();
		expect(cont.finished()).toBeFalsy();
		expect(c).toBe(0);
		cont.schedule();
		expect(c).toBe(2);
	});

	it("should be able to create a continuation and run it asynchronously", function (done) {
		var c = 0
		,	f
		;

		cont.add(function() {
			expect(cont.running()).toBeTruthy();
			expect(cont.finished()).toBeFalsy();
			++c;
		});
		cont.add(function() {
			expect(cont.running()).toBeTruthy();
			expect(cont.finished()).toBeFalsy();
			++c;
		});

		cont.on_finished(function(ok) {
			expect(c).toBe(2);
			expect(ok).toBeTruthy();
			expect(cont.running()).toBeFalsy();
			expect(cont.finished()).toBeTruthy();
			done();
		});

		expect(cont.running()).toBeFalsy();
		expect(cont.finished()).toBeFalsy();
		expect(c).toBe(0);
		cont.schedule(SLICE_SIZE, true);

		expect(cont.running()).toBeTruthy();
		expect(cont.finished()).toBeFalsy();
		expect(c).toBe(0);
	});

	it("should be able to dynamically add a continuation of a job to the front of the queue", function (done) {
		var c = 0
		,	f
		;

		cont.add(function() {
			++c;
			return function() {
				expect(c).toBe(1);
				++c;
			};
		});
		cont.add(function() {
			expect(c).toBe(2);
			++c;
		});

		cont.on_finished(function(ok) {
			expect(c).toBe(3);
			expect(ok).toBeTruthy();
			done();
		});
		cont.schedule(SLICE_SIZE, true);
	});

	it("should be able to dynamically add another job to the back of the queue", function (done) {
		var c = 0
		,	f
		;

		cont.add(function() {
			++c;
			cont.add(function() {
				expect(c).toBe(2);
				++c;
			});
		});
		cont.add(function() {
			expect(c).toBe(1);
			++c;
		});

		cont.on_finished(function(ok) {
			expect(c).toBe(3);
			expect(ok).toBeTruthy();
			done();
		});
		cont.schedule(SLICE_SIZE, true);
	});

	it("should be able to abort continuations", function (done) {
		var c = 0
		,	f
		;

		cont.add(function() {
			cont.abort();
			expect(cont.running()).toBeFalsy();
			expect(cont.finished()).toBeTruthy();
		});

		cont.add(function() {
			// this should never get called
			expect(false).toBeTruthy();
		});


		cont.on_finished(function(ok) {
			expect(ok).toBeFalsy();
			done();
		});

		cont.schedule(SLICE_SIZE, true);
	});

	// the following tests rely on timings and are thus subject to http://ejohn.org/blog/how-javascript-timers-work/
	// if anyone reading this has an idea how to formulate them more safely, please go ahead and improve it!

	// for example, if the clock underlying Date.now() is ever corrected backwards, this
	// test could fail. 

	it("should be able to defer part of the continuation to later time-slices", function (done) {
		var c = 0
		,	end_time_last_job = null
		,	fcont
		;

		cont.add(function(timer) {
			var first = timer()
			,	real_first = Date.now()
			,	cur = first
			,	new_cur
			;

			// allow for 1 ms timing inaccuracy
			expect( SLICE_SIZE - first ).toBeLessThan(2);

			// idle-loop the slice away. At some point, exactly 0 must be returned
			// and the sequence must be monotonously decreasing. It need not be
			// strictly monotonous, though, because of the underlying timer precision.
			while(true) {
				new_cur = timer();
				expect(cur).not.toBeLessThan(new_cur);
				cur = new_cur;
				if(cur === 0) {
					break;
				}
			}

			var last = timer()
			,	real_last = Date.now()
			;
			// allow for 1 ms timing inaccuracy
			expect( Math.abs((real_last - real_first) - (first - last)) ).toBeLessThan(2);
			end_time_last_job = Date.now();

			return function() {
				// continuation happens in next slice!
				// we cannot make too tight assumptions, but at least 5ms should have passed
				expect(Date.now() - end_time_last_job).not.toBeLessThan(5);
			};
		});

		cont.add(function() {
			expect(end_time_last_job).toBeTruthy();
			// next job also happens in next slice!
			// we cannot make too tight assumptions, but at least 5ms should have passed
			expect(Date.now() - end_time_last_job).not.toBeLessThan(5);

			// this implicitly checks if dynamically adding finished callbacks works
			cont.on_finished(function() {
				done();
			});
		});

		cont.schedule(SLICE_SIZE, true);
	});
});
