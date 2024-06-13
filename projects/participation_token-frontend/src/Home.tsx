// src/components/Home.tsx
import { Config as AlgokitConfig } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import ConnectWallet from './components/ConnectWallet'
import MethodCall from './components/MethodCall'
import * as methods from './methods'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  AlgokitConfig.configure({ populateAppCallResources: true })

  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appId, setAppId] = useState<number>(0)
  const [assetId, setAssetId] = useState<bigint>(0n)
  const [unitsLeft, setUnitsLeft] = useState<bigint>(0n)
  const [event_name, setEvent_name] = useState<string>('')
  const [asset_name, setAsset_name] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(0)
  const [ipfs_url, setIpfs_url] = useState<string>('')
  const [creator, setCreator] = useState<string | undefined>(undefined)

  // const { activeAddress, signer } = useWallet()

  useEffect(() => {
    ptClient
      .getGlobalState()
      .then((globalState) => {
        const id = globalState.assetId?.asBigInt() || 0n
        setAssetId(id)
        algorand.account.getAssetInformation(algosdk.getApplicationAddress(appId), id).then((info) => {
          setUnitsLeft(info.balance)
        })
      })
      .catch(() => {
        setAssetId(0n)
        setUnitsLeft(0n)
      })

    algorand.client.algod
      .getApplicationByID(appId)
      .do()
      .then((response) => {
        setCreator(response.params.creator)
      })
      .catch(() => {
        setCreator(undefined)
      })
  }, [appId])

  // const algodConfig = getAlgodConfigFromViteEnvironment()
  // const algorand = AlgorandClient.fromConfig({ algodConfig })
  // algorand.setDefaultSigner(signer)

  // const dmClient = new DigitalMarketplaceClient(
  //   {
  //     resolveBy: 'id',
  //     id: appId,
  //     sender: { addr: activeAddress!, signer },
  //   },
  //   algorand.client.algod,
  // )

  const { ptClient, algorand, activeAddress } = methods.initilizeClients(appId)

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const [data, setData] = useState<(string | string)[][]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (!e.target?.result) return // Ensure e.target.result is not null
        const data = new Uint8Array(e.target.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | string)[][]

        setData(jsonData)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">AlgoKit 🙂</div>
          </h1>
          <p className="py-6">
            This starter has been generated using official AlgoKit React template. Refer to the resource below for next steps.
          </p>

          <div className="grid">
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            <div className="divider" />

            <label className="label">App ID</label>
            <input
              type="number"
              className="input input-bordered m-2"
              value={appId}
              onChange={(e) => setAppId(e.currentTarget.valueAsNumber || 0)}
            />

            <div className="divider" />

            {activeAddress && appId === 0 && (
              <div>
                <label className="label">Event Name</label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={event_name}
                  onChange={(e) => setEvent_name(e.currentTarget.value || '')}
                />
              </div>
            )}

            {activeAddress && appId === 0 && (
              <div>
                <label className="label">Asset Name</label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={asset_name}
                  onChange={(e) => setAsset_name(e.currentTarget.value || '')}
                />
              </div>
            )}

            {activeAddress && appId === 0 && (
              <div>
                <label className="label">IPFS Url</label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={ipfs_url}
                  onChange={(e) => setIpfs_url(e.currentTarget.value || '')}
                />
              </div>
            )}

            {activeAddress && appId === 0 ? (
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={quantity.toString()}
                  onChange={(e) => setQuantity(Number(e.currentTarget.value || '0'))}
                />
                <MethodCall
                  methodFunction={methods.create(
                    algorand,
                    ptClient,
                    activeAddress,
                    event_name,
                    asset_name,
                    ipfs_url,
                    quantity,
                    0n,
                    setAppId,
                  )}
                  text="Create Token"
                />
              </div>
            ) : (
              ''
            )}

            {activeAddress == creator && appId !== 0 && unitsLeft !== 0n && (
              <div>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
                <MethodCall methodFunction={methods.sendMinimumBalance(algorand, data, activeAddress)} text={`Send Minimum Balance`} />
              </div>
            )}

            {appId !== 0 && (
              <div>
                <label className="label">Asset ID</label>
                <input type="text" className="input input-bordered" value={assetId.toString()} readOnly />
                <label className="label">Units Left</label>
                <input type="text" className="input input-bordered" value={unitsLeft.toString()} readOnly />
              </div>
            )}

            <div className="divider" />

            {activeAddress != creator && appId !== 0 && unitsLeft !== 0n && (
              <div>
                <MethodCall methodFunction={methods.claim(algorand, ptClient, activeAddress, assetId)} text={`Claim`} />
              </div>
            )}

            {activeAddress === creator && appId !== 0 && (
              <MethodCall methodFunction={methods.deleteApp(ptClient, setAppId)} text="Delete App" />
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
