
// Temporary in-memory storage for MVP demo
export let mockClaims: any[] = [
  {
    id: 'claim-demo-1',
    number: 'SIN20251001',
    type: 'AUTO_SIMPLES',
    classification: 'VERDE',
    column: 'NOVOS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    portalToken: '1111-2222-3333-4444',
    insured: {
      id: 'ins-demo-1',
      name: 'João Silva Santos',
      phone: '5511987654321',
      email: 'joao@email.com'
    },
    documents: [
      { id: 'doc-demo-1', item: 'CNH', status: 'PENDENTE' },
      { id: 'doc-demo-2', item: 'DOC_VEICULO', status: 'PENDENTE' },
      { id: 'doc-demo-3', item: 'BO', status: 'PENDENTE' }
    ],
    events: []
  },
  {
    id: 'claim-demo-2', 
    number: 'SIN20251002',
    type: 'AUTO_SIMPLES',
    classification: 'AMARELO',
    column: 'A_CONTACTAR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    portalToken: '5555-6666-7777-8888',
    insured: {
      id: 'ins-demo-2',
      name: 'Maria Oliveira Santos',
      phone: '5511876543210',
      email: 'maria@email.com'
    },
    documents: [
      { id: 'doc-demo-4', item: 'CNH', status: 'PENDENTE' },
      { id: 'doc-demo-5', item: 'DOC_VEICULO', status: 'PENDENTE' },
      { id: 'doc-demo-6', item: 'BO', status: 'PENDENTE' }
    ],
    events: []
  }
]

export function addMockClaim(claim: any) {
  mockClaims.unshift(claim)
}

export function updateMockClaim(id: string, updates: any) {
  const claimIndex = mockClaims.findIndex(claim => claim.id === id)
  if (claimIndex !== -1) {
    mockClaims[claimIndex] = {
      ...mockClaims[claimIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return mockClaims[claimIndex]
  }
  return null
}

export function getMockClaim(id: string) {
  return mockClaims.find(claim => claim.id === id)
}
