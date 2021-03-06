"use strict";

const P = require("./promise");

/**
 * This tests make sure that the implementation is 1:1 with specs from https://promisesaplus.com.
 */
// Terminology
// 1.	“promise” is an object or function with a then method whose behavior conforms to this specification.
// 2.	“thenable” is an object or function that defines a then method.
// 3.	“value” is any legal JavaScript value (including undefined, a thenable, or a promise).
// 4.	“exception” is a value that is thrown using the throw statement.
// 5.	“reason” is a value that indicates why a promise was rejected.
describe("Requirements", () => {
  describe("Promise States", () => {
    // A promise must be in one of three states: pending, fulfilled, or rejected.
    describe("When pending, a promise: ", () => {
      describe("may transition to either the fulfilled or rejected state.", () => {
        it("fulfilled", done => {
          const p = new P((resolve, reject) => {
            resolve();
          });
          p.then(() => {
            // Resolved
            done();
          });
        });
        it("rejected", done => {
          const p = new P((resolve, reject) => {
            reject();
          });
          p.then(
            () => {},
            () => {
              // Rejected
              done();
            }
          );
        });
      });
    });
    describe("When fulfilled, a promise:", () => {
      it("must not transition to any other state.", done => {
        const p = new P((resolve, reject) => {
          resolve();
        });
        p.then(
          () => {
            done();
          },
          () => {
            expect.reject("Should not be rejected");
          }
        );
      });
      it("must have a value, which must not change.", done => {
        const p = new P((resolve, reject) => {
          resolve(123);
        });
        p.then(val => {
          expect(val).toBe(123);
          done();
        });
      });
    });
    describe("When rejected, a promise:", () => {
      it("must not transition to any other state.", done => {
        const p = new P((resolve, reject) => {
          reject();
        });
        p.then(
          () => {
            expect.reject("Should not be resolved");
          },
          () => {
            done();
          }
        );
      });
      it("must have a reason, which must not change.", done => {
        // Here, “must not change” means immutable identity (i.e. ===), but does not imply deep immutability.
        // The then Method
        const err = { error: 123 };
        const p = new P((resolve, reject) => {
          reject(err);
        });
        p.then(undefined, val => {
          expect(val).toBe(err);
          done();
        });
      });
    });
  });

  describe("The then method", () => {
    // A promise must provide a then method to access its current or eventual value or reason.
    // A promise’s then method accepts two arguments:
    // promise.then(onFulfilled, onRejected)
    describe("Both onFulfilled and onRejected are optional arguments:", () => {
      it("If onFulfilled is not a function, it must be ignored.", () => {
        const p = new P((resolve, reject) => {
          resolve();
        });
        p.then(undefined);
      });
      it("If onRejected is not a function, it must be ignored.", () => {
        const p = new P((resolve, reject) => {
          reject();
        });
        p.then(val => {}, undefined);
      });
    });
    describe("If onFulfilled is a function:", () => {
      it("it must be called after promise is fulfilled, with promise’s value as its first argument.", done => {
        const foo = { v: 123 };
        const p = new P((resolve, reject) => {
          resolve(foo);
        });
        p.then(val => {
          expect(val).toBe(foo);
          done();
        });
      });
      it("it must not be called before promise is fulfilled.", done => {
        const state = { isPromiseFullfilled: false };
        const p = new P((resolve, reject) => {
          state.isPromiseFullfilled = true;
          resolve();
        });
        p.then(val => {
          expect(state.isPromiseFullfilled).toBe(true);
          done();
        });
      });
      it("it must not be called more than once.", done => {
        const state = { numberCalls: 0 };
        const p = new P((resolve, reject) => {
          resolve();
        });
        p.then(val => {
          state.numberCalls += 1;
          expect(state.numberCalls).toBe(1);
          setTimeout(done, 0);
        });
      });
    });
    describe("If onRejected is a function,", () => {
      it("it must be called after promise is rejected, with promise’s reason as its first argument.", done => {
        const reason = { err: 123 };
        const p = new P((resolve, reject) => {
          reject(reason);
        });
        p.then(undefined, val => {
          expect(val).toBe(reason);
          done();
        });
      });
      it("it must not be called before promise is rejected.", done => {
        const state = { isPromiseRejected: false };
        const p = new P((resolve, reject) => {
          state.isPromiseRejected = true;
          reject();
        });
        p.then(undefined, val => {
          expect(state.isPromiseRejected).toBe(true);
          done();
        });
      });
      it("it must not be called more than once.", done => {
        const state = { numberCalls: 0 };
        const p = new P((resolve, reject) => {
          reject();
        });
        p.then(undefined, val => {
          state.numberCalls += 1;
          expect(state.numberCalls).toBe(1);
          setTimeout(done, 0);
        });
      });
      it("onFulfilled or onRejected must not be called until the execution context stack contains only platform code. [3.1].", done => {
        const state = { isSyncCodeExecuted: false };
        const p = new P((resolve, reject) => {
          resolve();
        });
        p.then(val => {
          expect(state.isSyncCodeExecuted).toBe(true);
          done();
        });
        state.isSyncCodeExecuted = true;
      });
      it("onFulfilled and onRejected must be called as functions (i.e. with no this value). [3.2]", done => {
        const p1 = new P((resolve, reject) => {
          resolve();
        });
        p1.then(val => {
          expect(this).toEqual({});
          done();
        });
        const p2 = new P((resolve, reject) => {
          reject();
        });
        p2.then(undefined, val => {
          expect(this).toEqual({});
          done();
        });
      });
      describe("then may be called multiple times on the same promise.", () => {
        it("If/when promise is fulfilled, all respective onFulfilled callbacks must execute in the order of their originating calls to then.", done => {
          const state = {
            c1: false,
            c2: false,
            c3: false
          };
          const p = new P((resolve, reject) => {
            setTimeout(resolve);
          });
          p.then(() => {
            expect(state.c1).toBeFalsy();
            expect(state.c2).toBeFalsy();
            expect(state.c3).toBeFalsy();
            state.c1 = true;
          });
          p.then(() => {
            expect(state.c1).toBeTruthy();
            expect(state.c2).toBeFalsy();
            expect(state.c3).toBeFalsy();
            state.c2 = true;
          });
          p.then(() => {
            expect(state.c1).toBeTruthy();
            expect(state.c2).toBeTruthy();
            expect(state.c3).toBeFalsy();
            state.c3 = true;
            done();
          });
        });
        it("If/when promise is rejected, all respective onRejected callbacks must execute in the order of their originating calls to then.", done => {
          const state = {
            c1: false,
            c2: false,
            c3: false
          };
          const p = new P((resolve, reject) => {
            setTimeout(reject);
          });
          p.then(undefined, () => {
            expect(state.c1).toBeFalsy();
            expect(state.c2).toBeFalsy();
            expect(state.c3).toBeFalsy();
            state.c1 = true;
          });
          p.then(undefined, () => {
            expect(state.c1).toBeTruthy();
            expect(state.c2).toBeFalsy();
            expect(state.c3).toBeFalsy();
            state.c2 = true;
          });
          p.then(undefined, () => {
            expect(state.c1).toBeTruthy();
            expect(state.c2).toBeTruthy();
            expect(state.c3).toBeFalsy();
            state.c3 = true;
            done();
          });
        });
      });
      it("then must return a promise [3.3].", done => {
        const state = {
          c1: false,
          c2: false,
          c3: false
        };
        const p = new P((resolve, reject) => {
          setTimeout(resolve);
        });
        p.then(() => {
          expect(state.c1).toBeFalsy();
          expect(state.c2).toBeFalsy();
          expect(state.c3).toBeFalsy();
          state.c1 = true;
          return 1;
        })
          .then(val => {
            expect(val).toBe(1);
            expect(state.c1).toBeTruthy();
            expect(state.c2).toBeFalsy();
            expect(state.c3).toBeFalsy();
            state.c2 = true;
            return 2;
          })
          .then(val => {
            expect(val).toBe(2);
            expect(state.c1).toBeTruthy();
            expect(state.c2).toBeTruthy();
            expect(state.c3).toBeFalsy();
            state.c3 = true;
            done();
          });
      });
      describe("promise2 = promise1.then(onFulfilled, onRejected);", () => {
        describe("If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).", () => {
          it("onFullfilled", done => {
            const p = new P((resolve, reject) => {
              setTimeout(resolve);
            });
            p.then(() => {
              return 123;
            }).then(val => {
              expect(val).toBe(123);
              done();
            });
          });
          it("onRejected", done => {
            const p = new P((resolve, reject) => {
              setTimeout(reject);
            });
            p.then(undefined, () => {
              return 123;
            }).then(val => {
              expect(val).toBe(123);
              done();
            });
          });
        });
        describe("If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.", () => {
          it("onFullfilled", done => {
            const p = new P((resolve, reject) => {
              setTimeout(resolve);
            });
            p.then(() => {
              throw "Error 123";
            }).then(undefined, val => {
              expect(val).toBe("Error 123");
              done();
            });
          });
          it("onRejected", done => {
            const p = new P((resolve, reject) => {
              setTimeout(reject);
            });
            p.then(undefined, () => {
              throw "Error 123";
            }).then(undefined, val => {
              expect(val).toBe("Error 123");
              done();
            });
          });
        });
        it("If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value as promise1.", done => {
          const p = new P((resolve, reject) => {
            setTimeout(() => resolve(123));
          });
          p.then(undefined).then(val => {
            expect(val).toBe(123);
            done();
          });
        });
        it("If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason as promise1.", done => {
          const p = new P((resolve, reject) => {
            setTimeout(() => reject(123));
          });
          p.then(undefined, undefined).then(undefined, val => {
            expect(val).toBe(123);
            done();
          });
        });
      });
    });
  });
  describe("The Promise Resolution Procedure", () => {
    // The promise resolution procedure is an abstract operation taking as input a promise and a
    // value, which we denote as [[Resolve]](promise, x). If x is a thenable, it attempts to make
    // promise adopt the state of x, under the assumption that x behaves at least somewhat like a
    // promise. Otherwise, it fulfills promise with the value x.
    //
    // This treatment of thenables allows promise implementations to interoperate, as long as they
    // expose a Promises/A+-compliant then method. It also allows Promises/A+ implementations to
    // “assimilate” nonconformant implementations with reasonable then methods.
    // To run [[Resolve]](promise, x), perform the following steps:
    describe("If promise and x refer to the same object, reject promise with a TypeError as the reason.", () => {
      describe("If x is a promise, adopt its state [3.4]:", () => {
        describe("If x is pending, promise must remain pending until x is fulfilled or rejected.", () => {
          it("resolved", done => {
            const state = {
              called: false,
              resolveInternal: undefined
            };
            const p = new P((resolve, reject) => {
              setTimeout(() =>
                resolve(
                  new P((resolve, reject) => {
                    state.resolveInternal = resolve;
                  })
                )
              );
            });
            p.then(val => {
              state.called = true;
              expect(val).toBe(123);
              done();
            });
            setTimeout(() => {
              // Async check that the promise didn't fullfill before we call resolveInternal
              expect(state.called).toBe(false);
              state.resolveInternal(123);
            });
          });
          it("rejected", done => {
            const state = {
              called: false,
              rejectInternal: undefined
            };
            const p = new P((resolve, reject) => {
              setTimeout(() =>
                resolve(
                  new P((resolve, reject) => {
                    state.rejectInternal = reject;
                  })
                )
              );
            });
            p.then(undefined, val => {
              state.called = true;
              expect(val).toBe(123);
              done();
            });
            setTimeout(() => {
              // Async check that the promise didn't fullfill before we call resolveInternal
              expect(state.called).toBe(false);
              state.rejectInternal(123);
            });
          });
        });
        it("If/when x is fulfilled, fulfill promise with the same value.", done => {
          const p = new P((resolve, reject) => {
            setTimeout(() => resolve(new P((resolve, reject) => resolve(123))));
          });
          p.then(val => {
            expect(val).toBe(123);
            done();
          });
        });
        it("If/when x is rejected, reject promise with the same reason.", done => {
          const p = new P((resolve, reject) => {
            setTimeout(() => resolve(new P((resolve, reject) => reject(123))));
          });
          p.then(undefined, val => {
            expect(val).toBe(123);
            done();
          });
        });
      });
      describe("Otherwise, if x is an object or function,", () => {
        it("Let then be x.then. [3.5]", done => {
          const state = { onResolveInternal: undefined };
          const p = new P((resolve, reject) => {
            setTimeout(() =>
              resolve({
                then: (onResolve, onReject) =>
                  (state.onResolveInternal = onResolve)
              })
            );
          });
          p.then(val => {
            expect(val).toBe(123);
            done();
          });
          setTimeout(() => state.onResolveInternal(123));
        });
        it("If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.", done => {
          const p = new P((resolve, reject) => {
            setTimeout(() =>
              resolve({
                get then() {
                  throw "No then";
                }
              })
            );
          });
          p.then(undefined, reason => {
            expect(reason).toBe("No then");
            done();
          });
        });
        describe("If then is a function, call it with x as this, first argument resolvePromise, and second argument rejectPromise, where:", () => {
          it("If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).", done => {
            const state = { onResolveInternal: undefined };
            const p = new P((resolve, reject) => {
              setTimeout(() =>
                resolve({
                  then: (onResolve, onReject) =>
                    (state.onResolveInternal = onResolve)
                })
              );
            });
            p.then(val => {
              expect(val).toBe(123);
              done();
            });
            setTimeout(() => state.onResolveInternal(123));
          });
          it("If/when rejectPromise is called with a reason r, reject promise with r.", done => {
            const state = { onRejectInternal: undefined };
            const p = new P((resolve, reject) => {
              setTimeout(() =>
                resolve({
                  then: (onResolve, onReject) =>
                    (state.onRejectInternal = onReject)
                })
              );
            });
            p.then(undefined, val => {
              expect(val).toBe(123);
              done();
            });
            setTimeout(() => state.onRejectInternal(123));
          });
          it("If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.", done => {
            const state = {
              onResolveInternal: undefined,
              onRejectInternal: undefined,
              promiseResolved: false
            };
            const p = new P((resolve, reject) => {
              resolve({
                then: (onResolve, onReject) => {
                  state.onResolveInternal = onResolve;
                  state.onRejectInternal = onReject;
                }
              });
            });
            p.then(
              val => {
                expect(val).toBe(123);
                state.promiseResolved = true;
              },
              val => {
                done("Error, this should be never called");
              }
            );
            setTimeout(() => {
              state.onResolveInternal(123);
              state.onRejectInternal(123);
              setTimeout(() => {
                expect(state.promiseResolved).toBeTruthy();
                done();
              });
            });
          });
          describe("If calling then throws an exception e,", () => {
            describe("If resolvePromise or rejectPromise have been called, ignore it.", () => {
              it("resolve", done => {
                const state = {
                  resolved: false
                };
                const p = new P((resolve, reject) => {
                  resolve({
                    then: (onResolve, onReject) => {
                      onResolve(123);
                      throw "error";
                    }
                  });
                });
                p.then(
                  val => {
                    expect(val).toBe(123);
                    state.resolved = true;
                  },
                  val => {
                    expect(val).toBe(123);
                    done("Should never be called");
                  }
                );
                setTimeout(() => {
                  expect(state.resolved).toBeTruthy();
                  done();
                });
              });
              it("reject", done => {
                const state = {
                  rejected: false
                };
                const p = new P((resolve, reject) => {
                  resolve({
                    then: (onResolve, onReject) => {
                      onreject(123);
                      throw "error";
                    }
                  });
                });
                p.then(
                  val => {
                    expect(val).toBe(123);
                    done("Should never be called");
                  },
                  val => {
                    state.rejected = true;
                    expect(val).toBe(123);
                  }
                );
                setTimeout(() => {
                  expect(state.rejected).toBeTruthy();
                  done();
                });
              });
            });
            it("Otherwise, reject promise with e as the reason.", done => {
              const p = new P((resolve, reject) => {
                setTimeout(() =>
                  resolve({
                    then: () => {
                      throw "error";
                    }
                  })
                );
              });
              p.then(undefined, reason => {
                expect(reason).toBe("error");
                done();
              });
            });
          });
        });
        it("If then is not a function, fulfill promise with x.", done => {
          const p = new P((resolve, reject) => {
            resolve({
              then: 123
            });
          });
          p.then(val => {
            expect(val).toEqual({
              then: 123
            });
            done();
          });
        });
      });
      it("If x is not an object or function, fulfill promise with x.", done => {
        const p = new P((resolve, reject) => {
          resolve(123);
        });
        p.then(val => {
          expect(val).toBe(123);
          done();
        });
      });
    });
    // If a promise is resolved with a thenable that participates in a circular
    // thenable chain, such that the recursive nature of [[Resolve]](promise, thenable)
    // eventually causes [[Resolve]](promise, thenable) to be called again, following
    // the above algorithm will lead to infinite recursion. Implementations are encouraged,
    // but not required, to detect such recursion and reject promise with an informative TypeError as the reason. [3.6]
  });

  // Notes:
  // 3.1.	Here “platform code” means engine, environment, and promise implementation code. In practice, this requirement ensures that onFulfilled and onRejected execute asynchronously, after the event loop turn in which then is called, and with a fresh stack. This can be implemented with either a “macro-task” mechanism such as setTimeout or setImmediate, or with a “micro-task” mechanism such as MutationObserver or process.nextTick. Since the promise implementation is considered platform code, it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.
  // 3.2.	That is, in strict mode this will be undefined inside of them; in sloppy mode, it will be the global object.
  // 3.3.	Implementations may allow promise2 === promise1, provided the implementation meets all requirements. Each implementation should document whether it can produce promise2 === promise1and under what conditions.
  // 3.4.	Generally, it will only be known that x is a true promise if it comes from the current implementation. This clause allows the use of implementation-specific means to adopt the state of known-conformant promises.
  // 3.5.	This procedure of first storing a reference to x.then, then testing that reference, and then calling that reference, avoids multiple accesses to the x.then property. Such precautions are important for ensuring consistency in the face of an accessor property, whose value could change between retrievals.
  // 3.6.	Implementations should not set arbitrary limits on the depth of thenable chains, and assume that beyond that arbitrary limit the recursion will be infinite. Only true cycles should lead to a TypeError; if an infinite chain of distinct thenables is encountered, recursing forever is the correct behavior.
});

describe("Misc tests", () => {
  it("is ES6 promise interopeable", done => {
    const p = new P((resolve, reject) => {
      setTimeout(() => {
        resolve(new Promise((resolve, reject) => resolve(123)));
      });
    });

    p.then(val => {
      expect(val).toBe(123);
      done();
    });
  });
});
