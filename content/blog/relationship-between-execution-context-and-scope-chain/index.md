---
date: '2019-12-07'
title: '실행 컨텍스트와 스코프 체인의 관계'
description: '스코프 체인을 설명할 때 실행 컨텍스트 개념을 알아야 하는 이유'
banner: './images/banner.jpg'
published: true
---

> 이 글은 '코어 자바스크립트'를 읽고 정리한 글입니다. 🐯

[[1편: 실행 컨텍스트와 호이스팅의 관계](https://estaid.dev/relationship-between-execution-context-and-hoisting/)]에서 실행 컨텍스트의 기본적인 개념에 대해 알아봤습니다.

이어서 실행 컨텍스트와 스코프 체인의 관계에 대해 알아보겠습니다.

### 2. outerEnvironmentReference

**스코프**란 식별자에 대한 유효 범위를 말합니다. 자바스크립트에는 크게 함수 스코프와 블록 스코프가 존재하는데, 이 스코프를 안에서부터 바깥으로 차례로 검색 해나가는 것을 **스코프 체인**이라고 합니다. 그리고 이를 가능케 하는 것이 `LexicalEnvironment`의 2번째 수집 자료인 `outerEnvironmentReference`입니다.

`outerEnvironmentReference`는 현재 호출된 함수가 선언될 당시의 `LexicalEnvironment`를 참조합니다. (호출될 당시가 아닌 **선언될 당시**를 기억 해주세요.)

함수가 선언될 시점은 실행 컨텍스트가 활성화된 상태 밖에 없습니다.

```javaScript
function a() {
  function b() {
    function c() {
    }
  }
}
```

위와 같은 함수가 있다고 가정하면,

c 함수가 선언될 때 `outerEnvironmentReference`는 함수 b의 `LexicalEnvironment`를 참조합니다. 그리고 b 함수가 선언될 때 `outerEnvironmentReference`는 함수 a의 `LexicalEnvironment`를 참조합니다. 이처럼 `outerEnvironmentReference`는 **연결 리스트**와 같은 형태를 띱니다. 계속 상위로 찾아 올라가면 결국은 전역 컨텍스트의 `LexicalEnvironment`를 참조하게 됩니다. 검색하는 과정은 `environmentRecord`를 먼저 검색하고 `outerEnvironmentReference`를 검색합니다.

이러한 구조 덕분에 여러 스코프 체인이 있는 경우 **무조건 스코프 체인상에서 가장 먼저 발견된 식별자에만 접근이 가능**하게 됩니다.

아래는 스코프 체인에 대한 예제입니다.

```javaScript
function outer(a) {
  function inner() {
    console.log('inner:', a); // 1. ?
    var b = 2;
    }
  inner();
  console.log('outer:', b); // 2. ?
}
outer(1);
```

`inner`함수를 호출하면 `inner` 실행 컨텍스트가 활성화 되고 `environmentRecord`에 { b } 식별자를 저장합니다. `outerEnvironmentReference`에서는 `inner` 함수가 선언될 당시의 `outer`의 `LexicalEnvironment`를 참조합니다. 즉 [GLOBAL, { a, outer } ]를 복사합니다.

1.의 값은 `outerEnvironmentReference`에서 찾은 값 1을 출력합니다.

2.의 값은 `outer`의 `environmentRecord` 은 { a }이고 `outerEnvironmentReference` 는 [GLOBAL]입니다. b값은 찾을 수 없기 때문에 레퍼런스 에러가 발생합니다.

```javaScript
var a = 1;
function outer() {
  function inner() {
    console.log('inner:', a); // 1. ?
    var a = 2;
  }
  inner();
  console.log('outer:', a); // 2. ?
}
outer();
console.log('global:', a); // 3. ?
```

위 예제와 비슷하나 `inner` 함수 내부가 다릅니다. `inner` 함수가 호출되면 해당 실행 컨텍스트가 활성화 상태가 됩니다. 그리고 `environmentRecord`에 식별자 { a }를 저장합니다.

그리고 `outerEnvironmentReference`에 `outer`의 `LexicalEnvironment`인 [GLOBAL, { a }]를 참조합니다.

1.의 값은 inner 함수의 `environmentRecord`를 찾은 값 undefined를 출력합니다.

2.의 값은 `outerEnvironmentReference`에서 찾은 값 1을 출력합니다.

3.의 값도 `outerEnvironmentReference`에서 찾은 값 1을 출력합니다.
