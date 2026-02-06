import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Geocode Autocomplete Proxy
 * Proxies autocomplete requests to backend to keep ORS API key secure
 * GET /api/geocode/autocomplete?q=query&limit=6
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const limit = searchParams.get('limit') || '6';

        if (!query || query.length < 3) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Query must be at least 3 characters',
                },
                { status: 400 }
            );
        }

        // Get JWT token from request headers
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || '';

        // Forward request to backend
        // API_URL already includes /api, so we just add the endpoint
        const backendUrl = `${API_URL}/geocode/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`;

        console.log('🔍 Proxying geocode request to:', backendUrl);

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Geocoding service error' }));
            return NextResponse.json(
                {
                    success: false,
                    message: errorData.message || `Backend error: ${response.status}`,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Geocode autocomplete error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Internal server error',
            },
            { status: 500 }
        );
    }
}
