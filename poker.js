function ( ctx, a ) {
  if (!a) a = {}

  const _ = #s.backroom._()   // custom lib
    , $ = _.$                 // hackmud lib
    , db = _.db
    , _n = ctx.this_script    // name of script
    , _a = "backroom"         // author of script
    , _u = ctx.caller         // user of script
    , SUDO = _u === _a        // user is author (admin mode)
    , BUYIN = 1000
    , MAX_PLAYERS = 6
    , MIN_PLAYERS = 2

  let state = db.get_state()
  , user = db.get_user()
  , view = db.get_view()

  // Reset / Initialize DB
  if ( a.erase_and_reset && a.confirm === true && SUDO ) {
    db.erase_and_reset();
  }

  // DETERMINE WHO CAN ACT...

  // Join
  if ( a.join ) {
    if (! _.is_empty(user) ) return { ok:false } // You are already a player
    if (db.player_count() >= MAX_PLAYERS || state.status !== "idle") return {ok:false} // Too many players or game in progress
    // TODO: process payment
    _.broadcast(" Joining... ");
    db.join();

    // Check start condition
    let pc = db.player_count();
    if (! ( pc >= MIN_PLAYERS && pc <= MAX_PLAYERS ) ) return pc + " players ready"; // Too many/few players

    // Start the game
    state.status = "playing";
    let players = db.get_players();
    players.forEach( (player) => state.order.push( player.uid ) );

    // Deal the cards
    state.deck = _.get_deck(state);
    players.forEach( (player) => db.deal_hand( player.uid, [state.deck.shift(), state.deck.shift()] ) );

    // Save state and update players
    db.set_state(state);
    view = db.get_view()
    _.broadcast( ` board:"${view.board.join(", ")}", pot:"${$.to_gc_str(view.pot)}" ` )
    _.alert_current_player( db.get_player( state.order[state.current_player_index] ) );
  }

  // Leave
  if ( a.leave ) {
    if ( _.is_empty(user) ) return {ok:false} // You are not a player
    // TODO: process winnings
    db.remove_user();

    // Last player left
    if ( db.player_count() <= 0 ) {
      db.reset_state();
    }
  }

  // GAME / TURN LOGIC

  // Clear players who left from the order
  // if ( !(state.order[0] in state.players) ) {
  //   state.order = state.order.slice(1);
  // }

  //return db.get_view(); // PRESENT VIEW TO PLAYER(S)
  view = db.get_view();
  user = db.get_user();
  let rv = $.json.stringify(db.get_view());
  if (! _.is_empty( user ) && view.status == "playing" ) rv += `\n\n${ _.view_hand( user.hand ) } | ${ user.balance }$`;
  return `chats.join{channel:"BACKROOM"}\n${rv}`;

}
