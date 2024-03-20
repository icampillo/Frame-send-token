/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'

import img from "../../../public/degen.png"

import { baseSepolia } from "viem/chains";
import { getContract } from 'viem';
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, parseEther } from "viem";
// import abi from './abi.json';
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

  const hash = await walletClient.sendTransaction({ 
    account,
    to: '0x85d11E4eae5d95932b082c52AC1aB1C487E24f3B',
    value: parseEther('0.001')
  })
  console.log("hash", hash)

  return c.res({
    action: "/coupon",
    image: img.src,
    intents: [
      <Button action="/">go back</Button>,
    ],
    title: "Pinta Hat Store",
  });
});


export const GET = handle(app)
export const POST = handle(app)
