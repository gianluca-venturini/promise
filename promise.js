"use strict";
/**
 * Toy implementation of promise.
 */
const P = function(callback) {
  const resolve = function(val) {
    this.fullfilledValue = val;
    this.isFullfilled = true;
    this.chainEvaluation();
  };
  const reject = function(val) {
    this.rejectedValue = val;
    this.isRejected = true;
    this.chainEvaluation();
  };

  this.onFullfilledArray = [];
  this.onRejectedArray = [];
  this.isFullfilled = false;
  this.isRejected = false;
  this.fullfilledValue = undefined;
  this.rejectedValue = undefined;

  this.chainEvaluation = function() {
    if (this.isFullfilled || this.isRejected) {
      process.nextTick(this.chainExecution.bind(this));
    }
  };

  this.chainExecution = function() {
    if (this.isFullfilled) {
      let onFullfill = undefined;
      while ((onFullfill = this.onFullfilledArray.shift())) {
        onFullfill.call(undefined, this.fullfilledValue);
      }
    }
    if (this.isRejected) {
      let onRejected = undefined;
      while ((onRejected = this.onRejectedArray.shift())) {
        onRejected.call(undefined, this.rejectedValue);
      }
    }
  };

  callback(resolve.bind(this), reject.bind(this));
};

P.prototype.then = function(onFulfilled, onRejected) {
  return new P((resolve, reject) => {
    if (onFulfilled) {
      this.onFullfilledArray.push(val => {
        try {
          const newVal = onFulfilled(val);
          resolve(newVal);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      this.onFullfilledArray.push(resolve);
    }
    if (onRejected) {
      this.onRejectedArray.push(val => {
        try {
          const newVal = onRejected(val);
          resolve(newVal);
        } catch (err) {
          reject(err);
        }
      });
    } else {
      this.onRejectedArray.push(reject);
    }
    this.chainEvaluation();
  });
};

module.exports = P;
