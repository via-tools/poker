function ( ctx, a ) {
  const
    _ = #s.backroom._()   // custom lib
    , $ = _.$                 // hackmud lib
    , db = _.db
    , _view = #s.backroom._view()
    , _n = ctx.this_script    // name of script
    , _a = "backroom"         // author of script
    , _u = ctx.caller         // user of script
    , SUDO = _u === _a        // user is author (admin mode)
    , BUYIN = 1000
    , MAX_PLAYERS = 6
    , MIN_PLAYERS = 1
    , PHASES = ["preflop", "flop", "river", "turn", "reveal"]
    , LAST_PHASE = PHASES.length - 1 // 0 = pre-flop, 1 = flop, 2 = river, 3 = turn
    , update_game = function ( state ) {
        // Save state and update players
        db.set_state( state );
        _view.broadcast( $.json.stringify( db.get_view() ) );
      }
    , end_round = function ( state ) {
        // TODO: establish winner
        // reset the pot
        state.pot = 0;
        return state;
      }
    , start_round = function ( state ) {
        // shuffle deck
        state.deck = _.get_deck();
        // deal cards
        db.get_players().forEach( ( player ) => db.deal_hand( player.uid, [ state.deck.shift(), state.deck.shift() ] ) );
        // rotate dealer to next player
        state.game_order.push(state.game_order.shift());
        // establish round order
        state.game_order.forEach( ( player ) => state.round_order.push( player ) );
        // done
        return state;
      }
    , start_game = function ( state ) {
        // game now in session
        state.status = "playing";
        // establish game/seat order
        db.get_players().forEach( ( player ) => state.game_order.push( player.uid ) );
        // done
        return state;
      }
    , end_phase = function ( state ) {
        for (key in state.bets) {
          state.pot += state.bets[key];
          delete state.bets[key];
        }
        return state;
      }
    , start_phase = {
        preflop( state ) {

        },
        flop( state ) {
          _.repeat( 3, () => state.board.push( state.deck.shift() ) );
          return state;
        },
        river( state ) {
          state.board.push( state.deck.shift() );
          return state;
        },
        turn( state ) {
          state.board.push( state.deck.shift() );
          return state;
        },
        evaluation( state ) {

        }
      }
    , next_turn = function ( state ) {
        // Clear players who left game
        let in_round = [];
        state.round_order.forEach( (player_uid) => { if (! _.is_empty(db.get_player(player_uid)) ) in_round.push(player_uid) } );
        state.round_order = in_round;

        // Look for end of round trigger
        if ( state.round_order.length < 1 ) { // TODO: CURRENTLY EVERYONE HAS TO FOLD
            state = end_round( state );
            return start_round( state );
        }

        // Look for end of phase trigger
        if ( state.bets[state.round_order + 1 % state.round_order.length] === state.min_bet ) {
          state = end_phase( state );
          return start_phase[PHASES[state.phase += 1]]( state );
        }
      }
    , take_bet = function ( user, bet ) {
        if ( _.is_empty(user) ) return -1;
        if ( user.balance < bet ) return -1;
        return db.set_balance( user.balance - bet );
      }

  // SUPER OVERRIDE DATABASE RESET
  if ( a && a.erase_and_reset && a.confirm === true && SUDO ) {
    return db.erase_and_reset();
  }

  // No args
  if (!a) return _view.render( db.get_user(), db.get_view() );

  let
    state = db.get_state()
    , user = db.get_user()

  // Leave
  if ( a.leave ) {
    if ( _.is_empty(user) ) return {ok:false, msg:"Not a player"} // You are not a player
    // TODO: process winnings
    db.remove_user();

    // Last player left
    if ( db.player_count() <= 0 ) {
      db.reset_state();
    }

    return _view.render(  db.get_user(), db.get_view() )
  }

  // Join
  if ( a.join ) {
    if (! _.is_empty(user) ) return { ok:false, msg:"Already player" } // You are already a player
    if (db.player_count() >= MAX_PLAYERS || state.status !== "idle") return {ok:false, msg:"Player Count / Game Progress"}
    // TODO: process payment
    _view.broadcast(" Joining... ");
    db.join();

    // Check start condition
    let pc = db.player_count();
    if (! ( pc >= MIN_PLAYERS && pc <= MAX_PLAYERS ) ) return pc + " players ready"; // Too many/few players

    // Start the game
    state = start_game(state);

    // Start the round
    state = start_round(state);

    // // Save state and update players
    update_game(state);
    return _view.render( db.get_user(), db.get_view() )
  }

  // GAME / TURN LOGIC
  if ( state.status === "playing" && state.round_order[0] === user.uid ) {

    if ( (! $.is_def(a.bet) ) && (a.fold !== true) ) return {ok:false, msg:"Your turn bet/fold"} // your turn, gotta do something...

    if ( a.bet ) {
      // get bet amount
      let bet = a.bet;
      // prep bets tracker
      if (! state.bets.hasOwnProperty(user.uid) ) state.bets[user.uid] = 0;
      // get bet from user's balance
      if ( bet < state.min_bet ) return {ok:false, msg:"Min bet"} // bet not enough
      if (! take_bet( db.get_user(), bet ) ) return {ok:false, msg:"Take bet"}
      // Bet successfully removed from balance
      state.bets[user.uid] += bet;
      state.round_order.push(state.round_order.shift()); //
    }

    if ( a.fold ) {
      state.round_order.shift(); // remove this player from round
    }

    // Turn complete successfully
    state = next_turn( state );
    update_game( state );
    return _view.render( db.get_user(), db.get_view() );
  }

  return _view.render( db.get_user(), db.get_view() );
}
