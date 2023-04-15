import React, { useCallback, useState } from 'react';

import {
  usePlaidLink,
  PlaidLinkOnSuccess,
  PlaidLinkOnEvent,
  PlaidLinkOnExit,
  PlaidLinkOptions,
} from 'react-plaid-link';

const App = () => {
  const [token, setLinkToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // get a link_token from your API when component mounts
  React.useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch(`http://localhost:3333/create-link-token`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({"client":"Dante"})
      });
      const { link_token } = await response.json();
      console.log(`Link token: ${link_token}`);
      setLinkToken(link_token);
    };
    createLinkToken();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (publicToken, metadata) => {
    // send public_token to your server
    // https://plaid.com/docs/api/tokens/#token-exchange-flow
    console.log(publicToken, metadata);
    const response = await fetch(`http://localhost:3333/exchange-public-token`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({"public_token": publicToken})
    });
    const { access_token } = await response.json();
    console.log(`Link token: ${access_token}`);
    setAccessToken(access_token);
  }, []);
  const onEvent = useCallback<PlaidLinkOnEvent>((eventName, metadata) => {
    // log onEvent callbacks from Link
    // https://plaid.com/docs/link/web/#onevent
    console.log(eventName, metadata);
  }, []);
  const onExit = useCallback<PlaidLinkOnExit>((error, metadata) => {
    // log onExit callbacks from Link, handle errors
    // https://plaid.com/docs/link/web/#onexit
    console.log(error, metadata);
  }, []);

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
    onEvent,
    onExit,
  };

  const {
    open,
    ready,
    // error,
    // exit
  } = usePlaidLink(config);

  return (
    <>
      <button onClick={() => open()} disabled={!ready}>
        Connect a bank account
      </button>
      <p>{accessToken}</p>
    </>
  );
};

export default App;
