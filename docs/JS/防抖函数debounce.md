# 防抖函数 debounce

防抖函数 debounce 指的是某个函数在某段时间内，无论触发了多少次回调，都只执行最后一次。假如我们设置了一个等待时间 3 秒的函数，在这 3 秒内如果遇到函数调用请求就重新计时 3 秒，直至新的 3 秒内没有函数调用请求，此时执行函数，不然就以此类推重新计时。

## 实现方案

利用定时器，函数第一次执行时设定一个定时器，之后调用时发现已经设定过定时器就清空之前的定时器，并重新设定一个新的定时器，如果存在没有被清空的定时器，当定时器计时结束后触发函数执行。

```
function debounce(fn,wait=3000){
  let timer = null;
  return function(...args){
    if(timer) clearTimeout(timer);
    timer = setTimeout(() => {
        fn.apply(this, args)
    }, wait)
  }
}

```

如果想第一次促发回调，需要改写上函数，增加第一次是否促发执行功能

```
function debounce(fn,wait=3000, immediate){
  let timer = null;
  return function(...args){
    if(timer) clearTimeout(timer);

    if(immediate && !timer){
      fn.apply(this, args)
    }

    timer = setTimeout(() => {
        fn.apply(this, args)
    }, wait)
  }
}
```

实现原理比较简单，判断传入的 immediate 是否为 true，另外需要额外判断是否是第一次执行防抖函数，判断依旧就是 timer 是否为空，所以只要 immediate && !timer 返回 true 就执行 fn 函数，即 fn.apply(this, args)。

## 加强版 throttle

现在考虑一种情况，如果用户的操作非常频繁，不等设置的延迟时间结束就进行下次操作，会频繁的清除计时器并重新生成，所以函数 fn 一直都没办法执行，导致用户操作迟迟得不到响应。

有一种思想是将「节流」和「防抖」合二为一，变成加强版的节流函数，关键点在于「 wait 时间内，可以重新生成定时器，但只要 wait 的时间到了，必须给用户一个响应」。这种合体思路恰好可以解决上面提出的问题。

给出合二为一的代码之前先来回顾下 throttle 函数，上一小节中有详细的介绍。

```
// fn 是需要执行的函数
// wait 是时间间隔
const throttle = (fn, wait = 50) => {
  // 上一次执行 fn 的时间
  let previous = 0
  // 将 throttle 处理结果当作函数返回
  return function(...args) {
    // 获取当前时间，转换成时间戳，单位毫秒
    let now = +new Date()
    // 将当前时间和上一次执行函数的时间进行对比
    // 大于等待时间就把 previous 设置为当前时间并执行函数 fn
    if (now - previous > wait) {
      previous = now
      fn.apply(this, args)
    }
  }
}
```

结合 throttle 和 debounce 代码，加强版节流函数 throttle 如下，新增逻辑在于当前触发时间和上次触发的时间差小于时间间隔时，设立一个新的定时器，相当于把 debounce 代码放在了小于时间间隔部分。

```

// fn 是需要节流处理的函数
// wait 是时间间隔
function throttle(fn, wait) {

  // previous 是上一次执行 fn 的时间
  // timer 是定时器
  let previous = 0, timer = null

  // 将 throttle 处理结果当作函数返回
  return function (...args) {

    // 获取当前时间，转换成时间戳，单位毫秒
    let now = +new Date()

    // ------ 新增部分 start ------
    // 判断上次触发的时间和本次触发的时间差是否小于时间间隔
    if (now - previous < wait) {
    	 // 如果小于，则为本次触发操作设立一个新的定时器
       // 定时器时间结束后执行函数 fn
       if (timer) clearTimeout(timer)
       timer = setTimeout(() => {
          previous = now
        	fn.apply(this, args)
        }, wait)
    // ------ 新增部分 end ------

    } else {
       // 第一次执行
       // 或者时间间隔超出了设定的时间间隔，执行函数 fn
       previous = now
       fn.apply(this, args)
    }
  }
}
```
