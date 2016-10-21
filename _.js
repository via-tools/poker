function (ctx, a) {
  const
    $ = #s.scripts.lib()
    , _ch = "BACKROOM"
    , _a = "backroom"
    , _u = ctx.caller
    , _cs = ctx.calling_script
    , _init_state = {
        sid: "state"
        , status: "idle"
        , current_player_index: 0
        , order: []
        , deck: []
        , board: []
        , pot: 0
      }
    , _init_player = {
        sid: "player"
        , status: "ready"
        , uid: _u
        , hand: []
        , balance: 1000
      }
    , _shuffle = function (array) {
        // Shuffle algorithm, https://www.frankmitchell.org/2015/01/fisher-yates/
        let i = 0
          , j = 0
          , temp = null
        for (i = array.length - 1; i > 0; i -= 1) {
          j = $.math.floor($.math.random() * (i + 1));
          temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
        return array;
      }

  return {
    $
    , is_empty(obj) {
        if (obj === null) return true;
        if (! $.is_def(obj) ) return true;
        return Object.keys(obj).length === 0;
      }
    , broadcast(msg) {
        #s.chats.create({name:_ch});
        #s.chats.send({channel:_ch, msg});
      }
    , alert_current_player(player) {
        #s.chats.send({channel:_ch, msg:` @${player.uid}'s turn `});
      }
    , get_deck() {
        // create and shuffle deck
        let deck = []
          , suits = "@ # % &".split(" ")
          , ranks = "2 3 4 5 6 7 8 9 A B C D E F".split(" ")
          , temp = suits.map((suit)=>ranks.map((rank)=>{ return {rank, suit} }))
        temp.forEach((e) => deck = deck.concat(e));
        return _shuffle(deck);
      }
    , view_hand (hand) {
        return `${hand[0].rank}${hand[0].suit} ${hand[1].rank}${hand[1].suit}`
      }
    , db: {
        erase_and_reset () {
          if (! (_cs && _u === _a) ) return false
          #db.r( {} );
          return #db.i( _init_state )
        }
        , reset_state() {
            return #db.u( {sid:"state"}, {$set: _init_state} )
          }
        , get_state() {
            return #db.f( { sid:"state" } ).first()
          }
        , get_user() {
            return #db.f( { sid:"player", uid:_u} ).first()
          }
        , get_player(uid) {
            return #db.f( {sid:"player", uid} ).first()
          }
        , get_players() {
            return #db.f( { sid:"player"} ).array();
          }
        , set_state(state) {
            return #db.u( { sid:"state" }, { $set: state } )
          }
        , join() {
            return #db.i( _init_player )
          }
        , player_count() {
            return #db.f( { sid:"player", status:"ready" } ).count()
          }
        , remove_user() {
            return #db.r( {sid:"player", uid:_u} )
          }
        , get_view() {
            return #db.f( { sid:"state" }, {_id:0, board:1, pot:1, current_player_index:1, order:1, status:1 } ).first()
          }
        , deal_hand(uid, hand) {
            return #db.u( { sid:"player", uid }, { $set: { hand } } )
          }
      }
  }
}
