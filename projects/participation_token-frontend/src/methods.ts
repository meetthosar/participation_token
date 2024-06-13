import * as algokit from '@algorandfoundation/algokit-utils'
import AlgorandClient from '@algorandfoundation/algokit-utils/types/algorand-client'
import { useWallet } from '@txnlab/use-wallet'
import { ParticipationTokenClient } from './contracts/ParticipationToken'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

export function initilizeClients(appId: number) {
  const { activeAddress, signer } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })
  algorand.setDefaultSigner(signer)

  const ptClient = new ParticipationTokenClient(
    {
      resolveBy: 'id',
      id: appId,
      sender: { addr: activeAddress!, signer },
    },
    algorand.client.algod,
  )

  return { ptClient, algorand, activeAddress, signer }
}
/**
 * Create the application and opt it into the desired asset
 */
export function create(
  algorand: algokit.AlgorandClient,
  ptClient: ParticipationTokenClient,
  sender: string,
  event_name: string,
  asset_name: string,
  ipfs_url: string,
  quantity: number,
  assetBeingClaimed: bigint,
  setAppId: (id: number) => void,
) {
  return async () => {
    let assetId = assetBeingClaimed

    // console.log((await algorand.account.getInformation(sender)).amount)
    if (assetId === 0n) {
      const assetCreate = await algorand.send.assetCreate({
        sender,
        total: BigInt(quantity),
        unitName: event_name,
        assetName: asset_name,
        url: ipfs_url,
        manager: sender,
        reserve: sender,
        freeze: sender,
        clawback: sender,
      })

      assetId = BigInt(assetCreate.confirmation.assetIndex!)
    }

    const createResult = await ptClient.create.createApplication({ assetId, quantity })

    const mbrTxn = await algorand.transactions.payment({
      sender,
      receiver: createResult.appAddress,
      amount: algokit.algos(0.5),
      extraFee: algokit.algos(0.001),
    })

    await ptClient.optInToAsset({ payTxn: mbrTxn })

    await algorand.send.assetTransfer({
      assetId,
      sender,
      receiver: createResult.appAddress,
      amount: BigInt(quantity),
    })

    // await algorand.send.payment({
    //   receiver: createResult.appAddress,
    //   amount: algokit.algos(0.2 * quantity),
    //   sender: sender,
    // })

    setAppId(Number(createResult.appId))
  }
}

export function claim(algorand: algokit.AlgorandClient, ptClient: ParticipationTokenClient, sender: string, assetBeingClaimed: bigint) {
  return async () => {
    await algorand.send.assetOptIn({ sender: sender, assetId: assetBeingClaimed })

    await ptClient.claim({})

    // const state = await ptClient.getGlobalState()
    // const info = await algorand.account.getAssetInformation(appAddress, state.assetId!.asBigInt())
    // setUnitsLeft(info.balance)
  }
}

export function sendMinimumBalance(algorand: AlgorandClient, data: (string | string)[][], sender: string) {
  return async () => {
    data.forEach((row, rowIndex) => {
      row.forEach(async (cell, cellIndex) => {
        console.log(cell)

        const balance = (await algorand.account.getInformation(cell)).amount
        if (balance === 0 || balance < 0.2) {
          await algorand.send.payment({
            receiver: (await algorand.account.getInformation(cell)).address,
            amount: algokit.algos(0.3),
            sender: sender,
          })
        }
        // console.log(`Row ${rowIndex}, Column ${cellIndex}: ${cell}`)
        // Perform any additional processing you need here
      })
    })
  } //680143600
}

export function deleteApp(ptClient: ParticipationTokenClient, setAppId: (id: number) => void) {
  return async () => {
    await ptClient.delete.deleteApplication({}, { sendParams: { fee: algokit.algos(0.003) } })
    setAppId(0)
  }
}
