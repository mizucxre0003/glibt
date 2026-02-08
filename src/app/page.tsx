import { NextResponse } from 'next/server'

export default function Home() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h1>Server is Running</h1>
        </div>
    )
}
