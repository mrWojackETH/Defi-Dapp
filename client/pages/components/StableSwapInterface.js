import { ethers } from 'ethers'
import StablePair from '../../abis/contracts/StableSwap/StablePair.sol/StablePair.json'
import { stableswap, stableTokens } from '../../config'
import {MdSwapVert} from "react-icons/md"
import { useWeb3 } from '../../context/Web3Provider'
import { useState } from 'react'

export default function DefaultInterface() {
    const node = new ethers.providers.JsonRpcProvider('https://rpc.testnet.fantom.network')
    const wallet = useWeb3()
    const [selectedTokens, setSelectedTokens] = useState([stableTokens[0],stableTokens[1]])
    const [exchangeRate, setExchangeRate] = useState({dy:'0.00', slippage:''})
    const [amountIn, setAmountIn] = useState('0.00')
    const [pool, setPool] = useState('0xf5b87A616De1d277668AE2FC5d6b0003566192c6')
    const [_tokens, setTokens] = useState(stableTokens)
    const styles = {
        container: 'flex flex-col items-center mb-36',
        box: 'py-16 px-8 flex flex-col items-center rounded-md bg-d dark:bg-l text-l dark:text-d my-32',
        form: 'rounded-md border border-l/30 dark:border-d/30',
        select:'w-18 bg-d dark:bg-l outline-none cursor-pointer rounded-md px-2 py-4',
        input:'rounded-md outline-none px-4 dark:bg-l bg-d text-l dark:text-d' ,
        option: 'dark:bg-l bg-d text-l dark:text-d rounded-p-4',
        button: 'w-full mt-8 text-d font-bold dark:text-l px-16 py-4 rounded-md dark:bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] dark:from-gray-700 dark:via-gray-900 dark:to-black bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-500 to-yellow-100'
    }

    const PerformSwap = async(e) => {
        e.preventDefault()
        if(!wallet.provider) wallet.connect();
        try{
          const pair = new ethers.Contract(pool, StablePair.abi, wallet.signer) 
          const token0 = new ethers.Contract(selectedTokens[0].address, selectedTokens[0].abi, wallet.signer)
          const approval = await token0.approve(pair.address, parseInt(amountIn).toString())
          await approval.wait()
          const isZero = selectedTokens[0].name = 'USDC' ? '0' : '1'
          const tx = await pair.swap(isZero, (isZero==='1'?'0' : '1'), amountIn.toString(), '0')
          await tx.wait()
          console.log('Done')
        }catch(e){
          console.log(e)
    
        }
      } 
    
      const getPool =  (token0, token1) => {
        setSelectedTokens([token0, token1])
        setPool(stableswap.pools.get(token0.address, token1.address))
        updateExchangeRate(amountIn/ (10**18))
      }
    
      const updateExchangeRate = async(newAmount) =>{
        if(!parseInt(newAmount)>0){
          return 
        }
        const pairInstance = wallet.provider 
          ?  new ethers.Contract(pool, StablePair.abi, wallet.signer) 
          :  new ethers.Contract(pool,StablePair.abi, node)
        const _r0 = await pairInstance.balances(selectedTokens[0].name =='USDC' ? '0' : '1') 
        const _r1 = await pairInstance.balances(selectedTokens[0].name =='USDC' ? '1' : '1') 
        const r0 = parseFloat(_r0)
        const r1 = parseFloat(_r1)
        const dx = (parseFloat(newAmount) * 10 **18) * 0.997
        const dy = ((r1 * dx) / (r0 + dx)) 
        if (dy>r1){alert("Invalid amount"); setAmountIn('0.00'); return}
        const slippage = 1 - ((dy/dx) / (r1/r0))
        setExchangeRate({dy: dy/(10 **18), slippage})
        setAmountIn(parseFloat(newAmount) * 10 **18)
      
       
      }
      const switchSelected= async() => {
        setSelectedTokens(selectedTokens.reverse());  
        setTokens(_tokens.map((t,i) =>_tokens[i]))
        setExchangeRate({...exchangeRate, dy: 1/ exchangeRate.dy})
      }

  return (
    <div className={styles.container}>
          <div className={styles.box}>
          <div className={styles.form}>
          <select onChange={e=>getPool(JSON.parse(e.target.value), selectedTokens[1])} className={styles.select}>
              {_tokens.filter(token=>token.name != selectedTokens[1].name).map((token,i) => 
                token === selectedTokens[0] 
                ? <option key={i} value={JSON.stringify(token)} selected className={styles.option}>{token.name}</option>
                :  <option key={i} value={JSON.stringify(token)} className={styles.option}>{token.name}</option>)}

            </select>
            <input onChange={e=>updateExchangeRate(e.target.value)} type='number' placeholder='0.00' className={styles.input}></input>
          </div>
            <MdSwapVert className='h-8 my-4 flex justify-center cursor-pointer w-8' onClick={switchSelected} />
            <div className={styles.form}>
              <select onChange={e=>getPool(selectedTokens[0], JSON.parse(e.target.value))}  className={styles.select}>
              {_tokens.filter(token=>token.name != selectedTokens[0].name).map((token,i) => 
                token === selectedTokens[1]
                ?  <option key={i} value={JSON.stringify(token)} selected className={styles.option}>{token.name}</option>
                :  <option key={i} value={JSON.stringify(token)} className={styles.option}>{token.name}</option>)}

              </select>
              <input type='text' value={!amountIn!=0 ? '0.00' :exchangeRate.dy} disabled className={styles.input}></input>
            </div>
            {amountIn>0 && <span className='text-l/30 dark:text-d/70 text-sm mt-4'>Slippage: {exchangeRate.slippage * 100}%</span> }
            {wallet.provider 
            ? <button onClick={PerformSwap} className={styles.button}>Swap</button>
            : <button onClick={wallet.connect} className={styles.button}  >Connect</button>
            }  

          </div>
      </div>
  )
}

