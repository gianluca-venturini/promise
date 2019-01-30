This is a toy implementation of the Promises/A+ specs for learning and fun.

# Why?

why not?

## How to use it

It behaves as an ES6 Promise.

```
const p = new P((resolve, reject) => {
  setTimeout(() => {
    resolve(123);
  }, 100);
});

p.then(val => console.log(val));   // 123

p.then(val => {
    console.log(val);  // 123
    return 1;
  })
  .then(val => console.log(val));  // 1
```

It's interoperable with an ES6 promise and most of the other promise like objects.

```
const p = new P((resolve, reject) => {
  setTimeout(() => {
    resolve(new Promise((resolve, reject) => resolve(123)));
  }, 100);
});

p.then(val => console.log(val));  // 123
```
