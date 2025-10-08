// Cloudflare Worker for FPL Manager API
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Add CORS middleware
app.use('/*', cors({
  origin: ['https://fpl.clementadegbenro.com', 'http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
}))

// Helper function to fetch with User-Agent header
async function fetchWithUserAgent(url, options = {}) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    ...options.headers
  }
  
  return fetch(url, {
    ...options,
    headers
  })
}

// FPL API proxy endpoints
app.get('/api/fpl/bootstrap-static', async (c) => {
  try {
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching bootstrap static for season: ${season}`)
    
    // For current season, use the official FPL API
    if (season === '2024-25') {
      const url = 'https://fantasy.premierleague.com/api/bootstrap-static/'
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch FPL data' }, 500)
      }
      
      const data = await response.json()
      
      // Add season metadata to the response
      data.season = season
      data.isHistorical = false
      
      console.log(`Fetched current season bootstrap static for season ${season}`)
      return c.json(data)
    } else {
      // For historical seasons, return a placeholder for now
      // You can implement historical data fetching here
      return c.json({ 
        message: 'Historical data not yet implemented in Cloudflare Worker',
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching bootstrap static:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/entry/:teamId', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching team data for teamId: ${teamId}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/entry/${teamId}/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch team data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical team data not yet implemented in Cloudflare Worker',
        teamId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching team data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/entry/:teamId/event/:gameweek/picks', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const gameweek = c.req.param('gameweek')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching picks for teamId: ${teamId}, gameweek: ${gameweek}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/picks/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch picks data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical picks data not yet implemented in Cloudflare Worker',
        teamId,
        gameweek,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching picks data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/entry/:teamId/history', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching history for teamId: ${teamId}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/entry/${teamId}/history/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch history data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical data not yet implemented in Cloudflare Worker',
        teamId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching history data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/entry/:teamId/transfers', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching transfers for teamId: ${teamId}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/entry/${teamId}/transfers/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch transfers data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical transfers data not yet implemented in Cloudflare Worker',
        teamId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching transfers data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/entry/:teamId/cup', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching cup data for teamId: ${teamId}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/entry/${teamId}/cup/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch cup data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical cup data not yet implemented in Cloudflare Worker',
        teamId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching cup data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/entry/:teamId/event/:gameweek/live', async (c) => {
  try {
    const teamId = c.req.param('teamId')
    const gameweek = c.req.param('gameweek')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching live data for teamId: ${teamId}, gameweek: ${gameweek}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gameweek}/live/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch live data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical live data not yet implemented in Cloudflare Worker',
        teamId,
        gameweek,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching live data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/leagues-classic/:leagueId', async (c) => {
  try {
    const leagueId = c.req.param('leagueId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching league data for leagueId: ${leagueId}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch league data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical league data not yet implemented in Cloudflare Worker',
        leagueId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching league data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/leagues-h2h/:leagueId', async (c) => {
  try {
    const leagueId = c.req.param('leagueId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching H2H league data for leagueId: ${leagueId}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch H2H league data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical H2H league data not yet implemented in Cloudflare Worker',
        leagueId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching H2H league data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/event/:gameweek/live', async (c) => {
  try {
    const gameweek = c.req.param('gameweek')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching live event data for gameweek: ${gameweek}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/event/${gameweek}/live/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch live event data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical live event data not yet implemented in Cloudflare Worker',
        gameweek,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching live event data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/event/:gameweek', async (c) => {
  try {
    const gameweek = c.req.param('gameweek')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching event data for gameweek: ${gameweek}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/event/${gameweek}/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch event data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical event data not yet implemented in Cloudflare Worker',
        gameweek,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching event data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/fixtures', async (c) => {
  try {
    const season = c.req.query('season') || '2024-25'
    const gameweek = c.req.query('event')
    
    console.log(`Fetching fixtures for season: ${season}, gameweek: ${gameweek || 'all'}`)
    
    if (season === '2024-25') {
      let url = 'https://fantasy.premierleague.com/api/fixtures/'
      if (gameweek) {
        url += `?event=${gameweek}`
      }
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch fixtures data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical fixtures data not yet implemented in Cloudflare Worker',
        season,
        gameweek,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching fixtures data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/player/:playerId', async (c) => {
  try {
    const playerId = c.req.param('playerId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching player data for playerId: ${playerId}, season: ${season}`)
    
    if (season === '2024-25') {
      const url = `https://fantasy.premierleague.com/api/element-summary/${playerId}/`
      
      const response = await fetchWithUserAgent(url)
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch player data' }, 500)
      }
      
      const data = await response.json()
      data.season = season
      data.isHistorical = false
      
      return c.json(data)
    } else {
      return c.json({ 
        message: 'Historical player data not yet implemented in Cloudflare Worker',
        playerId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching player data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'cloudflare-worker'
  })
})

// Catch-all for undefined routes
app.all('*', (c) => {
  return c.json({ message: 'Route not found' }, 404)
})

export default app
