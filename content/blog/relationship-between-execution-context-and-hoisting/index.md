---
date: "2019-12-07"
title: "실행 컨텍스트와 호이스팅의 관계"
description: "호이스팅을 설명할 때 실행 컨텍스트 개념을 알아야 하는 이유"
banner: "./images/banner.jpg"
published: true
---

> 이 글은 '코어 자바스크립트'를 읽고 정리한 글입니다. 🐯

실행 컨텍스트란 실행할 코드에 제공할 환경 정보들을 모아놓은 객체로서, 동일한 스코프에 있는 코드들을 실행할 때 필요한 환경 정보를 모아 컨텍스트를 구성하고, 이를 호출 스택(콜 스택)에 쌓아서 실행 순서를 보장합니다.

![banner](https://raw.githubusercontent.com/ESTAID/estaid-starter-blog/master/content/blog/relationship-between-execution-context-and-hoisting/images/screenshot.png)

자바스크립트는 특정 실행 컨텍스트가 활성화되는 시점에 선언된 변수를 호이스팅하고, 외부 환경 정보를 구성하고, `this` 값을 설정하는 동작을 수행합니다.

실행 컨텍스트를 구성하는 방법은 다음과 같습니다.

- 전역 실행 컨텍스트: 특정 함수가 실행되지 않는 한 전역 컨텍스트에서 실행됩니다. 여기서 변수 객체를 생성하는 대신 `this`를 전역 객체(`global object`)를 활용합니다.
- 함수 실행 컨텍스트: **함수가 실행될 때마다 실행 컨텍스트가 생성됩니다.**
- `eval` 함수 실행 컨텍스트: `eval`함수도 자신만의 실행 컨텍스트를 가집니다.

실행 컨텍스트에 담기는 정보는 크게 2가지로 구성되어 있습니다.

## VariableEnvironment

현재 컨텍스트 내의 식별자 정보, 외부 환경 정보, 선언 시점의 `LexicalEnvironment`의 스냅샷을 유지합니다.

그래서 초기 `VariableEnvironment`에 담기는 내용은 `LexicalEnvironment`의 내용과 같지만, 코드 진행에 따라 내부의 값인 `environmentRecord`와 `outerEnvironmentReference`가 서로 달라지기 때문에 항상 같다고 볼 수 없습니다.

## LexicalEnvironment

한국어 번역에서는 '어휘적 환경', '정적 환경'이라는 단어가 가장 많이 등장하고 의미는 식별자와 변수가 매핑되는 곳이라고 할 수 있습니다. ES6 에서 `VariableEnvironment`와 `LexicalEnvironment` 둘의 차이점은 전자가 변수 `var`만 저장하는 반면, 후자는 함수 선언과 변수 `let`과 `const`의 바인딩도 저장합니다.

`LexicalEnvironment`에서는 두 가지 일을 합니다. 이 두 가지를 묶어서 **렉시컬 환경 객체** 라고 합니다.

_(참고로 아래 두 가지 내부는 VariableEnviroment도 가지고 있습니다.)_

### 1. environmentRecord

현재 컨텍스트와 관련된 코드의 식별자 정보들이 저장됩니다. 여기서 식별자란 매개변수의 이름, 선언한 함수, `var`로 선언된 변수명 등을 의미합니다. 컨텍스트 내부 전체를 처음부터 끝까지 쭉 훑어나가며 순서대로 메모리에 수집합니다.

자바스크립트 엔진은 코드가 실행되기 전에 벌써 식별자의 정보를 다 가지고 있습니다. 그렇다면 변수 정보를 수집하는 과정을 더욱 이해하기 쉬운 형태로 만들기 위해 식별자를 최 상단으로 끌어 올려도 자바스크립트 엔진이 코드를 해석하는데 큰 문제는 없을 것입니다. 이 개념이 호이스팅입니다.

호이스팅이란 '끌어올리다'라는 의미의 hoist에 ing를 붙여 만든 동명사로, 변수 정보를 수집하는 과정을 더욱 이해하기 쉬운 방법으로 대체한 가상의 개념입니다.

\*_실제로 자바스크립트 엔진이 식별자를 끌어 올리지는 않습니다._

몇 가지 예제를 통해 자세하게 보겠습니다.

```javascript
function foo(a) {
  // 수집 대상 1(매개변수)
  console.log(a) // ?
  var a // 수집 대상 2(변수 선언)
  console.log(a) // ?
  var a = 2 // 수집 대상 3(변수 선언)
  console.log(a) // ?
}
a(1)
```

이 형태를 호이스팅 개념을 도입하여 매개변수가 변수 선언/할당과 같다고 가정하여 변환한 상태로 바꿔보겠습니다.

(실제로 인자를 함수 내부의 다른 코드보다 먼저 선언/할당이 이뤄진 것으로 간주할 수 있습니다.)

```javascript
function foo() {
  var a // 수집 대상 1
  var a // 수집 대상 2
  var a // 수집 대상 3

  a = 1 // 수집 대상 1에 대한 할당 부분
  console.log(a) // 1
  console.log(a) // 1
  a = 2
  console.log(a) // 2
}
a(1)
```

이번엔 함수 호이스팅에 대한 예제를 보겠습니다.

```javascript
function foo() {
  console.lob(b) // ?
  var b = "b" // 수집 대상 1
  console.log(b) // ?
  function b() {} // 수집 대상 2
  console.log(b) // ?
}
foo()
```

foo 함수를 실행하는 순간 foo 함수의 실행 컨텍스트가 생성됩니다. 변수는 선언부와 할당부를 나누어 선언부만 끌어올리는 반면 함수 선언은 함수 전체를 끌어올립니다. 이유는 자바스크립트의 창시자인 Brendan Eich가 선언하는 위치와 상관 없이 유연하고 배우기 쉬운 언어로 만들고자 했기 때문입니다.

위 코드가 호이스팅이 마친 상태는 아래와 같습니다.

```javascript
function foo() {
  var b
  function b() {}

  console.log(b) // function b() {};
  b = "b"
  console.log(b) // b
  console.log(b) // b
}
```

위 2가지 개념을 적용하면 함수 선언문과 함수 표현식에 대한 차이도 알 수 있습니다.

함수 선언문(`function declaration`)은 함수명이 곧 변수명인 것을 의미하고, 함수 표현식(`function expression`)은 선언한 함수를 별도의 변수에 할당하는 것을 의미합니다.

예제를 통해 두 방식의 차이점에 대해 알아보겠습니다.

```javascript
console.log(sum(1, 2))
console.log(multiply(3, 4))

function sum(x, y) {
  return x + y
}

var multiply = function(x, y) {
  return x * y
}
```

호이스팅이 마친 상태는 다음과 같습니다.

```javascript
var sum = function(x, y) {
  return x + y
}
var multiply

console.log(sum(1, 2))
console.log(multiply(3, 4))

multiply = function(x, y) {
  return x * y
}
```

함수 선언문은 함수 전체를 호이스팅하지만 함수 표현식은 변수 선언부만 호이스팅하고 변수의 할당부는 원래 자리에 남겨둡니다. 함수를 다른 변수에 값으로써 '할당'한 것이 곧 함수 표현식입니다.

## 참고

`let`과 `const`는 실행 컨텍스트가 활성화되어 식별자 정보를 수집할 때 어떤 값도 가지고 있지 않지만, `var`는 `undefined`를 가지고 있기 때문에 `let`과 `const`를 선언되기 전에 접근하면 `reference error`가 발생하게 되는 것이고, `var` 변수가 선언되기 전에 접근하면 `undefined`라는 값을 반환하는 것입니다.


[[2편: 실행 컨텍스트와 스코프 체인의 관계](http://bit.ly/2suxX3R)]으로 넘어가기
