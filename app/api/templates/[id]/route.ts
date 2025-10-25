import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, subject, bodyText } = body
    
    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(bodyText && { body: bodyText }),
      }
    })
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('PATCH /api/templates/[id] error:', error)
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
      return NextResponse.json({ 
        error: errorMsg || 'Failed to update template' 
      }, { status: 500 })
  }
}

// DELETE template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.emailTemplate.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/templates/[id] error:', error)
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)
      return NextResponse.json({ 
        error: errorMsg || 'Failed to delete template' 
      }, { status: 500 })
  }
}
