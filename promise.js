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
      const onFullfill = this.onFullfilledArray.pop();
      if (onFullfill) {
        onFullfill.call(undefined, this.fullfilledValue);
      }
    }
    if (this.isRejected) {
      const onRejected = this.onRejectedArray.pop();
      if (onRejected) {
        onRejected.call(undefined, this.rejectedValue);
      }
    }
  };

  callback(resolve.bind(this), reject.bind(this));
};

P.prototype.then = function(onFulfilled, onRejected) {
  if (onFulfilled) {
    this.onFullfilledArray.push(onFulfilled);
  }
  if (onRejected) {
    this.onRejectedArray.push(onRejected);
  }
  this.chainEvaluation();
};

module.exports = P;
