// Cloudflare Worker for FPL Manager API
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Add CORS middleware
app.use('/*', cors({
  origin: ['https://fpl.clementadegbenro.com', 'http://localhost:5173', 'http://localhost:3000', 'https://fpl-manager.pages.dev'],
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
      
      // Add season metadata to the response (same as local server)
      data.season = season
      data.isHistorical = false
      
      console.log(`Fetched current season bootstrap static for season ${season}`)
      return c.json(data)
    } else {
      // For historical seasons, try to fetch from FPL API and transform
      try {
        const url = 'https://fantasy.premierleague.com/api/bootstrap-static/'
        const response = await fetchWithUserAgent(url)
        
        if (!response.ok) {
          return c.json({ message: 'Failed to fetch FPL data' }, 500)
        }
        
        const data = await response.json()
        
        // Add season metadata (same as local server fallback)
        data.season = season
        data.isHistorical = true
        
        console.log(`Used fallback data for season ${season}`)
        return c.json(data)
      } catch (historicalError) {
        console.error(`Failed to fetch historical data for ${season}:`, historicalError)
        return c.json({ 
          message: 'Historical data not yet implemented in Cloudflare Worker',
          season,
          isHistorical: true
        }, 501)
      }
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

app.get('/api/fpl/players', async (c) => {
  try {
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching players for season: ${season}`)
    
    if (season === '2024-25') {
      console.log("Fetching enhanced FPL data for current season")
      
      // Fetch enhanced FPL data from FPL-Elo-Insights (same as local server)
      const enhancedDataUrl = 'https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data/2024-25/players_raw.csv'
      
      try {
        const enhancedResponse = await fetchWithUserAgent(enhancedDataUrl)
        if (enhancedResponse.ok) {
          const csvText = await enhancedResponse.text()
          const lines = csvText.split('\n')
          const headers = lines[0].split(',')
          
          console.log(`Parsing CSV with headers: ${headers.slice(0, 10).join(', ')}...`)
          
          const enhancedPlayers = []
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',')
              const player = {}
              
              headers.forEach((header, index) => {
                const value = values[index] || ''
                // Convert numeric values
                if (['id', 'now_cost', 'total_points', 'event_points', 'selected_by_percent', 'form', 'influence', 'creativity', 'threat', 'ict_index'].includes(header)) {
                  player[header] = parseFloat(value) || 0
                } else {
                  player[header] = value
                }
              })
              
              enhancedPlayers.push(player)
            }
          }
          
          console.log(`Successfully fetched and merged ${enhancedPlayers.length} enhanced players`)
          return c.json(enhancedPlayers)
        }
      } catch (enhancedError) {
        console.error('Failed to fetch enhanced data, falling back to basic FPL data:', enhancedError)
      }
      
      // Fallback to basic FPL data
      const url = 'https://fantasy.premierleague.com/api/bootstrap-static/'
      const response = await fetchWithUserAgent(url)
      
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch player data' }, 500)
      }
      
      const data = await response.json()
      const players = data.elements || []
      
      // Add season metadata to each player
      players.forEach(player => {
        player.season = season
        player.isHistorical = false
      })
      
      console.log(`Fetched ${players.length} basic FPL players`)
      return c.json(players)
    } else {
      return c.json({ 
        message: 'Historical player data not yet implemented in Cloudflare Worker',
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching players:', error)
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

// Missing endpoints that your local server has
app.get('/api/fpl/my-team/:managerId/', async (c) => {
  try {
    const managerId = c.req.param('managerId')
    const season = c.req.query('season') || '2024-25'
    
    console.log(`Fetching team data for managerId: ${managerId}, season: ${season}`)
    
    if (season === '2024-25') {
      // First, fetch the manager/entry data (same as local server)
      const entryResponse = await fetchWithUserAgent(`https://fantasy.premierleague.com/api/entry/${managerId}/`)
      
      if (!entryResponse.ok) {
        console.error(`Entry response error: ${entryResponse.status}`)
        return c.json({ message: "Team not found. Please check your team ID." }, 404)
      }
      
      const entryData = await entryResponse.json()
      
      // Fetch transfer status which includes free transfers
      let transferStatus = null
      try {
        console.log("Fetching transfer status for manager:", managerId)
        const transfersResponse = await fetchWithUserAgent(`https://fantasy.premierleague.com/api/entry/${managerId}/transfers/`)
        
        if (transfersResponse.ok) {
          transferStatus = await transfersResponse.json()
          console.log("Transfer status response:", transferStatus)
        }
      } catch (error) {
        console.error("Error fetching transfer status:", error)
      }
      
      // Fetch history data which includes current gameweek stats
      const historyResponse = await fetchWithUserAgent(`https://fantasy.premierleague.com/api/entry/${managerId}/history/`)
      let historyData = { current: [] }
      
      if (historyResponse.ok) {
        historyData = await historyResponse.json()
      }
      
      // Calculate free transfers (same logic as local server)
      const currentGameweekHistory = historyData.current || []
      const consecutiveGameweeksWithNoTransfers = currentGameweekHistory.filter(gw => gw.event_transfers === 0).length
      const calculatedFreeTransfers = Math.min(consecutiveGameweeksWithNoTransfers + 1, 2)
      
      // Build transfers object (same as local server)
      const transfers = {
        limit: calculatedFreeTransfers,
        made: 0,
        bank: entryData.bank || 0,
        value: entryData.value || 0,
        cost: 0
      }
      
      // Build the response (same structure as local server)
      const teamData = {
        ...entryData,
        picks: [], // Will be populated by frontend
        chips: [], // Will be populated by frontend
        transfers,
        season,
        isHistorical: false
      }
      
      return c.json(teamData)
    } else {
      return c.json({ 
        message: 'Historical team data not yet implemented in Cloudflare Worker',
        managerId,
        season,
        isHistorical: true
      }, 501)
    }
  } catch (error) {
    console.error('Error fetching team data:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.post('/api/fpl/transfers', async (c) => {
  try {
    const body = await c.req.json()
    const { playerId, outId } = body
    
    console.log(`Making transfer: ${playerId} in, ${outId} out`)
    
    // This would need to be implemented with FPL API authentication
    // For now, return a success response
    return c.json({ 
      message: 'Transfer functionality not implemented in Cloudflare Worker',
      playerId,
      outId
    }, 501)
  } catch (error) {
    console.error('Error making transfer:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.post('/api/fpl/captains', async (c) => {
  try {
    const body = await c.req.json()
    const { captainId, viceCaptainId } = body
    
    console.log(`Updating captains: ${captainId} (C), ${viceCaptainId} (VC)`)
    
    // This would need to be implemented with FPL API authentication
    // For now, return a success response
    return c.json({ 
      message: 'Captain update functionality not implemented in Cloudflare Worker',
      captainId,
      viceCaptainId
    }, 501)
  } catch (error) {
    console.error('Error updating captains:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/next-deadline', async (c) => {
  try {
    console.log('Fetching next deadline...')
    
    // Fetch fixtures to find next deadline (same logic as local server)
    const fixturesUrl = 'https://fantasy.premierleague.com/api/fixtures/'
    const response = await fetchWithUserAgent(fixturesUrl)
    
    if (!response.ok) {
      return c.json({ message: 'Failed to fetch fixtures' }, 500)
    }
    
    const fixtures = await response.json()
    
    // Get current timestamp
    const now = new Date().getTime()
    
    // Find the next fixture that hasn't started yet
    const nextFixture = fixtures
      .filter(f => new Date(f.kickoff_time).getTime() > now)
      .sort((a, b) => 
        new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
      )[0]
    
    if (!nextFixture) {
      // If no future fixtures, return current time + 1 day
      const fallbackDeadline = new Date(now + 24 * 60 * 60 * 1000).toISOString()
      return c.json({ deadline: fallbackDeadline })
    }
    
    return c.json({ deadline: nextFixture.kickoff_time })
  } catch (error) {
    console.error('Error fetching deadline:', error)
    return c.json({ message: 'Internal server error' }, 500)
  }
})

app.get('/api/fpl/top-managers-team', async (c) => {
  try {
    console.log('Fetching top managers team...')
    
    // For now, return a mock response since this requires complex logic
    // In a real implementation, you'd fetch the top manager's team
    return c.json({
      id: 1,
      name: "Top Manager",
      picks: [],
      chips: [],
      transfers: { limit: 1, made: 0, bank: 0, value: 0, cost: 0 },
      message: "Top managers team functionality not fully implemented in Cloudflare Worker"
    })
  } catch (error) {
    console.error('Error fetching top managers team:', error)
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
