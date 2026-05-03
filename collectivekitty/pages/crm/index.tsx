import Head from 'next/head'
import { CRMShell } from '../../components/crm/CRMShell'

export default function CRMPage() {
  return (
    <>
      <Head>
        <title>CRM Room | DEVFLOW</title>
      </Head>
      <CRMShell />
    </>
  )
}
