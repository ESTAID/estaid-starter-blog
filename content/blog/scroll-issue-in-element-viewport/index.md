---
date: "2019-12-07"
title: "viewport 안에서 엘리먼트 위치 이슈를 처리한 방법"
description: "[이슈 리포트] 클릭 이벤트에서 발생한 스크롤 이슈"
banner: "./images/banner.jpg"
published: false
---

> 이벤트 발생 시 *특정 엘리먼트가 viewport 안에 위치하는 방법에 대해 정리하였습니다.*

키워드 알람 페이지 개편을 작업하고 QA 중 관심 키워드를 클릭하면 viewport 밖으로 사라진다는 피드백을 받았습니다. 원인을 파악하기 위해서 단계 별로 실행 했을 때 상황 재현은 다음과 같습니다.

- A 관심 키워드 딜 클릭
- A 관심 키워드에 해당하는 딜 리스트 노출
- B 관심 키워드 클릭
- B 관심 키워드가 viewport 밖으로 벗어남

![viewport/issue-view-1](https://raw.githubusercontent.com/ESTAID/estaid-starter-blog/master/content/blog/scroll-issue-in-element-viewport/images/issue-view.gif)

## 원인

문제의 원인은 관심 키워드 UI에 있었습니다. 관심 키워드 UI는 아코디언으로서 중복 선택이 불가능한 UI로 기획되었습니다. A 관심 키워드 선택 후 B 관심 키워드를 선택했을 때 A 관심 키워드가 닫히면서 자식 요소의 엘리먼트가 `display:none`처리 되면서 B 관심 키워드가 viewport 밖으로 사라지게 됩니다.

그림으로 표현하면 다음과 같습니다.

![screen](https://raw.githubusercontent.com/ESTAID/estaid-starter-blog/master/content/blog/scroll-issue-in-element-viewport/images/screen.png)

## 시도 1(scrollIntoView)

이러한 문제는 관심 키워드를 선택했을 때 `scrollIntoView`[(문서)](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)를 호출하여 일시적으로 해결할 수 있었습니다. `scrollIntoView`란 엘리먼트의 함수로써 `scrollIntoView()`가 호출된 엘리먼트를 화면에 노출하도록 엘리먼트의 상위 컨테이너를 스크롤합니다. 

```jsx
const onClick = () => {
	element.scrollIntoView();
}
```

하지만 위 함수만 호출할 경우 몇 가지 부자연스러운 동작을 합니다.

1. viewport안에 엘리먼트를 선택해도 스크롤이 이동된다.
2. 엘리먼트를 선택하면 무조건 최 상단에 붙는다.
3. 같은 엘리먼트를 2번 클릭해도 함수가 호출된다.

부자연스러운 동작을 하는 재현 영상은 다음과 같습니다.

![viewport/issue-view-2](https://raw.githubusercontent.com/ESTAID/estaid-starter-blog/master/content/blog/scroll-issue-in-element-viewport/images/issue-view-2.gif)

## 시도 2(getClientRects)

1번 문제를 해결하기 위해서 이전에 선택한 엘리먼트의 자식 요소가 닫히고 난 뒤 현재 클릭한 엘리먼트의 bottom 값을 구하기 위해 `getClientRects`[(문서)](https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects)를 사용하였습니다. bottom값을 구하면 그 값이 viewport height 값 안에 위치해 있는지 비교합니다. viewport를 벗어났을 때만 `scrollIntoView` 함수를 호출하는 방식을 생각했으나 약간의 문제점이 생겼습니다.

```jsx
const onClick = () => {
	const viewport = window.innerHeight;
	const { bottom } = element.getClientRects()[0];

	hidePrevChildElement();
  if(bottom < 0) { // element가 viewport 밖이라면
    element.scrollIntoView();
  }
}
```

## 시도 3(scrollTop)

2번 문제의 원인은 `scrollIntoView`를 실행하면 해당 엘리먼트가 최 상단으로 위치 하는게 원인이었습니다. 이를 해결하기 위해서 `scrollIntoView`를 실행한 뒤에 `documentElement`의 `scrollTop`[(문서)](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop) 값에 특정 값 을 빼서 공간을 만들 수 있었습니다. 

*아래 예시는 30이라는 값을 사용하였습니다.*

```jsx
const onClick = () => {
	const viewport = window.innerHeight;
	const { bottom } = element.getClientRects()[0];

	hidePrevChildElement();
  if(bottom < 0) { // element가 viewport 밖이라면
    element.scrollIntoView();
    document.documentElement.scrollTop =
    document.documentElement.scrollTop - 30;
  }
}
```

## 시도 4(useRef, isSameNode)

3번 문제는 동일한 관심 키워드를 연속으로 선택했을 때 나타나는 이슈입니다. 이전에 선택했던 엘리먼트를 기억하는 변수를 `useRef`[(문서)](https://ko.reactjs.org/docs/hooks-reference.html#useref)에 담아 두었습니다. 그리고 다음에 선택한 엘리먼트와 이전 엘리먼트를 비교하여 같은 엘리먼트이면 `srcollIntoView` 함수를 호출하지 않는 조건문을 추가하였습니다. 서로 다른 엘리먼트인지 비교하기 위해서 `isSameNode`[(문서)](https://developer.mozilla.org/en-US/docs/Web/API/Node/isSameNode) 함수를 사용하였습니다.

```jsx
import React from 'react';
...
const Component = () => {
  const prevElement = React.useRef(null);

  const onClick = element => {
    const viewport = window.innerHeight;
    const { bottom } = element.getClientRects()[0];

    if (!element.isSameNode(prevElement)) {
	    hidePrevChildElement();

	    if(bottom < 0) { // element가 viewport 밖이라면
		    element.scrollIntoView();
		    document.documentElement.scrollTop =
        document.documentElement.scrollTop - 30;
	    }

	    prevElement.current = element; // 선택한 엘리먼트 기억
    }
  }
}
```

## 결과

![solution](https://raw.githubusercontent.com/ESTAID/estaid-starter-blog/master/content/blog/scroll-issue-in-element-viewport/images/solution.gif)
