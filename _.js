function (ctx, a) {
  const
    $ = #s.scripts.lib()
    , _a = "backroom"
    , _u = ctx.caller
    , _cs = ctx.calling_script
    , _suits = "@ # % &".split(" ")
    , _ranks = "2 3 4 5 6 7 8 9 A B C D E F".split(" ")
    , _init_state = {
        sid: "state"
        , status: "idle"
        , pot: 0
        , game_order: []
        , round_order: []
        , deck: []
        , bets: {}
        , board: []
        , min_bet: 0
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
    , repeat(times, fn) {
          for(var i = 0; i < times; i++) fn();
      }
    , get_deck() {
        // create and shuffle deck
        let deck = []
          , temp = _suits.map((suit)=>_ranks.map((rank)=>{ return {rank, suit} }))
        temp.forEach((e) => deck = deck.concat(e));
        return _shuffle(deck);
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
            return #db.f( { sid:"state" }, { _id:0, sid:0, deck:0 } ).first();
          }
        , deal_hand(uid, hand) {
            return #db.u( { sid:"player", uid }, { $set: { hand } } )
          }
        , set_balance( balance ) {
            return #db.u( { sid:"player", uid:_u }, { $set: { balance } } )
          }
      }
  }
}
