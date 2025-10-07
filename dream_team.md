# **Dream Team Algorithm Enhancement: The Dual-Mode Engine for All Users**

This guide details a crucial improvement to the Dream Team algorithm, ensuring it provides powerful, tailored advice for both veteran FPL managers and brand new users who have no existing team data.

### **Part 1: The Problem \- The "New User" Edge Case**

You correctly identified a critical flaw: the **"Personalized Points Maximizer"** algorithm relies on having a user's current team data to suggest transfers. For a new user joining the game mid-season (e.g., in Gameweek 6), their myTeam data would be empty. This would cause the algorithm to fail and likely show an error, which is a poor user experience.

The feature must be robust enough to handle this scenario gracefully and provide immediate value.

### **Part 2: The Solution \- A Dual-Mode Algorithm**

We will upgrade the Dream Team feature to operate in one of two modes, which it will automatically select based on the user's data.

* Mode A: Personalized Transfer Optimizer (For Existing Users)  
  This is the "Points Maximizer" logic we've already designed. If the user has an existing squad (myTeam.picks is not empty), this mode will run to find the optimal transfers to maximize their points gain for the next gameweek.  
* Mode B: Initial Squad Builder (For New Users)  
  This is the new fallback mode. If the algorithm detects that the user has no team data, it will automatically switch to building the best possible 15-man squad from scratch, adhering to the £100.0m budget and all game rules. This provides an invaluable template for a new manager's first team.

### **Part 3: The "Initial Squad Builder" Algorithm in Detail**

This algorithm uses the "Long-Term Value" model to construct the most powerful, rule-compliant squad possible within the initial budget.

#### **Step 1: Use the "3-Gameweek Horizon" Score as the Core Metric**

As detailed in the previous guide, the cornerstone of our selection will be the **Value\_3GW** score. This ensures the team is built for sustained performance, not just a single good fixture.

* Value\_3GW Formula Reminder:  
  (ep\_next\_gw1 \+ ep\_next\_gw2 \+ ep\_next\_gw3) / now\_cost

#### **Step 2: The Greedy Selection Process**

This process builds the team piece by piece, always prioritizing the best value available while respecting the game's constraints.

1. **Initialization:**  
   * Start with a budget of 100.0.  
   * Create an empty squad array.  
   * Create an empty clubCounts object to track the "3 players per club" rule.  
   * Filter the entire player pool to remove anyone with chance\_of\_playing\_next\_round \< 75\.  
2. **Greedy Selection Loop:**  
   * The algorithm will iterate to fill the 15 squad slots (2 GKs, 5 DEFs, 5 MIDs, 3 FWDs).  
   * In each iteration, it scans the entire remaining player pool for the single player with the **highest Value\_3GW score** who can still be legally added to the squad (respecting budget, club, and position limits).  
   * Once the best value player is found, add them to the squad, update the remainingBudget, and increment their clubCount.  
   * Repeat until all 15 slots are filled.  
3. **Determine Starting XI and Bench:**  
   * Once the 15-man squad is selected, sort it by ep\_next (for the single upcoming gameweek).  
   * The algorithm will then automatically place the best 11 players into a valid formation (e.g., 3-4-3 or 3-5-2) to form the starting XI.  
   * The remaining 4 players (including the backup goalkeeper) will be placed on the bench in the correct order.  
4. **Set Captaincy:**  
   * The player in the starting XI with the highest ep\_next is made Captain.  
   * The player with the second-highest ep\_next is made Vice-Captain.  
* **Benefit:** This provides a new user with an instantly competitive, data-driven team that they can use as a blueprint for their initial squad selection.

### **Part 4: Implementation Steps for Your Agent**

The primary change will be within the DreamTeamPage.tsx component.

#### **Step 1: Implement Conditional Logic**

Instruct your agent to wrap the main algorithmic logic in a conditional check.

// Inside DreamTeamPage.tsx

// ... (fetch myTeam, allPlayers, etc.)

const dreamTeamResult \= useMemo(() \=\> {  
  // Check if the user has an existing team  
  if (myTeam && myTeam.picks && myTeam.picks.length \> 0\) {  
    // MODE A: User is an EXISTING player  
    // Run the "Personalized Points Maximizer" algorithm as previously defined.  
    // It will calculate the best transfers.  
    return calculatePersonalizedTransfers(myTeam, allPlayers, fixtures, teams);  
  } else {  
    // MODE B: User is a NEW player  
    // Run the "Initial Squad Builder" algorithm.  
    // It will build the best team from scratch.  
    return buildInitialSquad(allPlayers, fixtures, teams);  
  }  
}, \[myTeam, allPlayers, fixtures, teams\]);

#### **Step 2: Update the Return Values and UI Rendering**

1. **Standardize Return Objects:** Both algorithm functions (calculatePersonalizedTransfers and buildInitialSquad) should return an object with a consistent shape so the UI can handle both modes. Include a mode property.  
   * **Existing User Return:**  
     {  
       mode: 'optimizer',  
       optimalSquad: \[...\],  
       recommendedTransfers: \[...\],  
       pointsDelta: 5.7,  
       // ... and other stats  
     }

   * **New User Return:**  
     {  
       mode: 'builder',  
       optimalSquad: \[...\], // The full 15-man squad  
       recommendedTransfers: \[\], // Empty for this mode  
       // ... and other stats  
     }  
