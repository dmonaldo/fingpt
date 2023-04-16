import React, { useCallback, useEffect, useState } from 'react';

import {
  usePlaidLink,
  PlaidLinkOnSuccess,
  PlaidLinkOnEvent,
  PlaidLinkOnExit,
  PlaidLinkOptions,
} from 'react-plaid-link';

const App = () => {
  const [token, setLinkToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [transactions, setTransactions] = useState<[]>(() => {
    const transactions = localStorage.getItem('transactions');
    return transactions ? JSON.parse(transactions) : [];
  });
  const [accounts, setAccounts] = useState<[]>(() => {
    const accounts = localStorage.getItem('accounts');
    return accounts ? JSON.parse(accounts) : [];
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // get a link_token from your API when component mounts
  React.useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch(`http://localhost:3333/create-link-token`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ "client": "" })
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
      body: JSON.stringify({ "public_token": publicToken })
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

  const sync = async () => {
    console.log('syncing')
    setIsSyncing(true);
    setTransactions([]);
    setAccounts([]);
    try {
      const response = await fetch(`http://localhost:3333/sync-item`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ "access_token": accessToken })
      });
      const { transactions, accounts } = await response.json();
      console.log(`Transactions: ${transactions.length}`);
      console.log(`Accounts: ${accounts.length}`);
      setTransactions(transactions);
      setAccounts(accounts);
    } catch (error) {
      console.log(JSON.stringify(error));
    }
    setIsSyncing(false);
  };

  const clearSession = () => {
    setAccessToken(null);
    setTransactions([]);
    setAccounts([]);
  };

  useEffect(() => {
    if (accessToken !== null) {
      localStorage.setItem("accessToken", accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center">

          <h1 className="text-4xl font-bold mb-4">FinGPT</h1>

          <button className={`px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg m-2 ${accessToken === null ? '' : 'hidden'}`} onClick={() => open()} disabled={!ready}>
            Connect a bank account
          </button>

          <div className={`flex justify-center ${accessToken ? '' : 'hidden'}`}>
            <button className="px-6 py-2 border border-red-500 text-red-500 bg-transparent font-semibold rounded-lg m-2" onClick={() => clearSession()}>
              Clear session
            </button>
            <button className="flex items-center px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg m-2" onClick={() => sync()} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white center"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </>
              ) : (
                'Sync account'
              )}
            </button>
          </div>
          <br/>
          <p>{accessToken ? `Access Token: ******${accessToken.slice(-8)}` : ''}</p>
          <br/>
          <p>{transactions.length > 0 ? `Synced ${accounts.length} accounts and ${transactions.length} transactions` : ''}</p>
          <br/>
        </div>
      </div>
    </>
  );
};

export default App;
