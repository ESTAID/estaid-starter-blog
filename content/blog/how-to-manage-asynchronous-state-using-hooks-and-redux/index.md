---
date: '2020-01-12'
title: '비동기 상태를 hooks과 redux를 사용하여 관리하는 방법'
description: '[Advanced React] hooks와 redux의 조합해서 코드 양 줄이기'
banner: './images/banner.jpeg'
published: true
---

React에서 컴포넌트를 작성하다 보니 반복되는 패턴이 몇 가지 있었습니다. 예를 들어, API 비동기 호출하여 데이터를 받아오는 경우입니다. 이러한 경우에 저는 status 값을 정의하고 `loading`, `success`, `failure` 3가지로 나누어서 관리를 했고, UI(로딩 화면, 데이터 화면, 에러 화면)를 상황에 맞추어 노출하는 로직을 작성하여 사용하곤 했습니다.

API 요청하는 인자 값만 다르고 동작은 똑같기 때문에 위 작업을 하는 함수를 모듈화하여 재 사용할 수 있습니다. 먼저 hooks만 사용해서 패턴을 작성한 뒤, 리팩토링을 거쳐 Redux로 확장하도록 하겠습니다.

### hooks 정의

먼저 재 사용할 수 있는 hooks 함수를 선언하여 API 요청하는 함수와 의존성을 분리 시킵니다. 이 함수는 오로지 UI 상태만 관리하기 위해 API 요청하는 함수를 안에서 작성하지 않고 인자로 받아 실행 합니다.

```jsx
import { useState, useEffect } from 'react';

const useAsyncLocalStatus = fetch => {
  const [status, setStatus] = useState('initial');
  const [payload, setPayload] = useState({});
  useEffect(() => {
    const load = async () => {
      try {
        setStatus('loading');

        const { message } = await fetch();

        setPayload({ src: message });
        setStatus('success');
      } catch (e) {
        setPayload({});
        setStatus('failure');
      }
    };
    load();
  }, [fetch]);

  return { status, payload };
};
```

인자로 받은 `fetch` 함수는 API 요청 함수를 의미합니다. `useAsyncLocalStatus`함수를 사용하여 인자 값만 변경하여 재사용이 가능합니다. 위 함수를 사용하는 컴포넌트는 아래와 같습니다.

```jsx
import getDog from './API';
import Img from './img';
import useAsyncLocalStatus from './hook/useAsyncLocalStatus';

function App() {
  const fetch = React.useCallback(
    getDog('https://dog.ceo/API/breeds/image/random?'),
    []
  );

  const { payload, status } = useAsyncLocalStatus(fetch);

  return (
    <div className="App">
      <h5>this is img component area</h5>
      {payload.src && <Img src={payload.src} />}
      {status === 'loading' && <p>loading...</p>}
      {status === 'failure' && <p>failure...</p>}
    </div>
  );
}
```

컴포넌트에서 API요청 함수를 정의하고 리 렌더링 시 함수 재 생성을 막기 위해 useCallback으로 메모이제이션합니다. 이 문제를 해결하기 위해 Context API나 Redux를 사용하여 전역으로 상태 관리를 해주어야 하는데 이번 예제는 Redux로 해결하는 방법에 대해 알아보겠습니다. (그렇다고 무조건 Redux를 사용하는게 정답은 아닙니다.)

### Redux로 리팩토링

Redux는 다음과 같이 동작합니다.

- 컴포넌트가 마운트되면 status 값을 `loading`으로 변경하기 위해 액션을 실행합니다.
- fetcher()함수가 실행되고 payload에 응답 값을 담아서 액션을 실행합니다. Reducer는 status 값을 `success`로 변경하고 playload 값을 넣어줍니다.
- 만약 에러일 경우 payload에 에러 메세지를 담아서 액션을 실행합니다. Reducer는 status 값을 `failure`로 변경하고 errorDetail에 payload 값을 넣어줍니다.

Redux를 사용하기 위해 데이터를 저장할 스토어와 액션에 대한 정의가 필요합니다. action에 따른 행동을 동일하기 때문에 property 값 기준으로 action constants와 action creators를 일반화 할 수 있습니다.

Action에 대한 정의는 다음과 같습니다.

```jsx
// Action constants
export const LOADING = property => `${property}/loading`;
export const SUCCESS = property => `${property}/success`;
export const FAILURE = property => `${property}/failure`;

// Action creators
export const loadingAction = property => ({
  payload: {},
  type: LOADING(property),
});
export const successAction = (property, payload) => ({
  payload,
  type: SUCCESS(property),
});
export const failureAction = (property, error) => ({
  payload: { error },
  type: FAILURE(property),
});
```

Reducer에 대한 정의는 다음과 같습니다.

```jsx
import { combineReducers } from 'redux';
import { LOADING, SUCCESS, FAILURE } from './action';

const initialState = {
  status: 'initial',
  errorDetail: null,
  payload: null,
};

export const dogReducer = property => (state = initialState, action) => {
  switch (action.type) {
    case LOADING(property):
      return {
        ...state,
        status: 'loading',
        errorDetail: null,
      };
    case SUCCESS(property):
      return {
        ...state,
        status: 'success',
        errorDetail: null,
        payload: action.payload.message,
      };
    case FAILURE(property):
      return {
        ...state,
        status: 'failure',
        errorDetail: action.payload,
        payload: null,
      };
    default:
      return state;
  }
};

const dog = dogReducer('dog');
const reducer = combineReducers({ dog });

export default reducer;
```

이제 hooks에 대한 정의가 필요합니다. hooks는 Redux의 정보를 담고 있고, API 요청을 해야 합니다. Redux 액션을 실행하고 Reducer에 접근하기 위해 `useDispatch`와 `useSelector`를 사용합니다.

```jsx
import { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadingAction, successAction, failureAction } from '../redux/action';

export const useAsyncGlobalStateHook = ({
  property,
  fetch,
  state,
  dispatch,
}) => {
  const mounted = useRef(false);

  useEffect(() => {
    const fetcher = async () => {
      try {
        const response = await fetch();
        mounted.current && dispatch(successAction(property, response));
      } catch (e) {
        mounted.current && dispatch(failureAction(property, e));
      }
    };

    mounted.current = true;
    dispatch(loadingAction(property));
    fetcher();

    return () => {
      mounted.current = false;
    };
  }, [fetch, property, dispatch]);

  return state;
};

export const useAsyncState = (property, fetch) => {
  const dispatch = useDispatch();
  const state = useSelector(state => state[property]);

  return useAsyncGlobalStateHook({ property, fetch, state, dispatch });
};
```

이 hooks을 사용하는 컴포넌트는 아래와 같습니다.

```jsx
import React from 'react';
import { Img } from './img';
import { getDog } from './API';
import { useAsyncState } from './hooks/useAsyncGlobalStatus';

export const GlobalComponent = () => {
  const fetch = React.useCallback(
    getDog('https://dog.ceo/API/breeds/image/random'),
    [getDog]
  );

  const state = useAsyncState('dog', fetch);

  return (
    <div>
      <h5>this is redux component</h5>
      {state.status === 'success' && <Img src={state.payload} />}
      {state.status === 'loading' && <p>loading...</p>}
      {state.status === 'failure' && <p>failure...</p>}
    </div>
  );
};
```

### 결론

이렇게 작성하면

- 네트워크 상태를 관리하는 보일러 플레이트 코드를 줄일 수 있습니다.
- 한번 로드된 데이터는 어느 컴포넌트에서도 사용 가능합니다.
- Redux 로직은 추상화돼 있어서 그 부분에 대해서는 신경 쓸 필요가 없습니다.

이렇게 작성할 경우 고려해 볼 사항은

- 코드 확장성에 불리합니다.
- 액션 property가 값은 값을 넣을 때 override 되기 때문에 의도치 않은 사이드 이펙트가 발생합니다.

상황에 따라 위와 같은 패턴을 적용하면 반복되는 코드 양을 줄일 수 있습니다. 그러나 무분별한 모듈화는 개발 이후 코드 유지보수와 확장성이 어려울 수 있어서 충분한 기획 의도 파악과 API 설계에 대한 이해가 필요할 것 같습니다.

예제 코드는 아래에서 확인할 수 있습니다.

[[codesandbox 예제 코드](<[https://codesandbox.io/s/elegant-khorana-8ej5t](https://codesandbox.io/s/elegant-khorana-8ej5t)>)]
