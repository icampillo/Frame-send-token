/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, TransactionContext } from 'frog'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import img from "../../../public/degen.png"

import { baseSepolia, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, parseEther, parseAbi, Address } from "viem";

// import abi from './abi.json';

import { ZeroXSwapQuote } from './types'

type FrogOptions = {
  Bindings: { ZEROX_API_KEY?: string }
}

export type CustomTransactionContext = TransactionContext<FrogOptions>

const assets = [
  {
    name: '$HIGHER',
    network: 'base',
    image: 'https://i.imgur.com/bdQcnVI.png',
    address: '0x0578d8a44db98b23bf096a382e016e29a5ce0ffe',
  },
  {
    name: '$DEGEN',
    network: 'base',
    image:
      'https://pbs.twimg.com/profile_images/1751028059325501440/9jrvP_yG_400x400.jpg',
    address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
  },
]

const baseClient = createPublicClient({
  chain: base,
  transport: http(),
})

const account = privateKeyToAccount((process.env.PRIVATE_KEY as `0x`) || "");

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_APY}`),
});

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/', (c) => {
  const { buttonValue, inputText, status } = c
  const fruit = inputText || buttonValue
  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Claim your $TEST token 👇
        </div>
      </div>
    ),
    intents: [
      <Button action="/claim">Claim Token</Button>,
    ],
  })
})

app.frame("/claim", async (c) => {
  const [address] = await walletClient.getAddresses()

  // const hash = await walletClient.sendTransaction({ 
  //   account,
  //   to: '0x85d11E4eae5d95932b082c52AC1aB1C487E24f3B',
  //   value: parseEther('0.001')
  // })

  return c.res({
    action: "/coupon",
    image: img.src,
    intents: [
      <Button action="/select-token">Swap tokens</Button>,
    ],
    title: "Pinta Hat Store",
  });
});

app.frame('/select-token', (c) => {
  const { buttonValue, inputText, status } = c
  const fruit = inputText || buttonValue
  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Select the token you want to buy !
        </div>
      </div>
    ),
    intents: assets.map((asset) => (
      <Button action={`/${asset.network}/${asset.address}`}>
        {asset.name}
      </Button>
    )),
  })
})

app.frame("/:network/:token", async (c) => {
  const network = c.req.param('network' as never) as 'base' | 'optimism'
  const token = c.req.param('token' as never) as Address
  let symbol: string = 'Unknown Token'

  // if (network === 'base') {
  //   symbol = await baseClient.readContract({
  //     address: token,
  //     abi: parseAbi(['function symbol() view returns (string)']),
  //     functionName: 'symbol',
  //   })
  // } 

  return c.res({
    image: (
      <div
        style={{
          backgroundColor: 'white',
          alignItems: 'center',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <span >Buy ${symbol}</span>

        <span >
          This is experimental. Swap at your own risk. There is a 1% fee
        </span>
      </div>
    ),
    intents: [
      <TextInput placeholder="ETH amount (default 0.01)" />,
      <Button.Transaction target={`/tx?network=${network}&token=${token}`}>
        Buy
      </Button.Transaction>,
      <Button.Link href={`https://matcha.xyz/tokens/${network}/${token}`}>
        Sell
      </Button.Link>,
    ],
  })
});

app.transaction('/tx', async (c) => {
  const token = c.req.query('token') as Address
  const network = c.req.query('network') as 'base' | 'optimism'

  console.log("token", token)
  console.log("network", network)
  
  const value = c.inputText || '0.01'

  // prettier-ignore
  const baseUrl = `https://${network}.api.0x.org/swap/v1/quote?`
  const eth = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

  // https://0x.org/docs/0x-swap-api/api-references/get-swap-v1-quote#request
  const params = new URLSearchParams({
    buyToken: token,
    sellToken: eth,
    sellAmount: parseEther(value).toString(),
    feeRecipient: '0x00000b0A7308257BFD464868f14D34C5108fd898',
    buyTokenPercentageFee: '0.01',
  }).toString()

  const res = await fetch(baseUrl + params, {
    headers: { '0x-api-key': process.env.ZEROX_API_KEY || '' },
  })

  const order = (await res.json()) as ZeroXSwapQuote

  return c.send({
    chainId: `eip155:${network === 'base' ? '8453' : '10'}`,
    to: order.to,
    data: order.data,
    value: BigInt(order.value),
  })
})


export const GET = handle(app)
export const POST = handle(app)
