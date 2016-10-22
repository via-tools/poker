function (ctx, a) {
  const
    _ = #s.backroom._()
    , $ = _.$
    , _ch = "BACKROOM"
    , spectator_view = function (view) {
        return $.json.stringify(view);
      }
    , user_view = function (user, view) {
        let
          folded = !view.round_order.includes(user.uid)
          , rv = spectator_view(view) + `

card_1: "${ user.hand[0].rank+user.hand[0].suit }"
card_2: "${ user.hand[1].rank+user.hand[1].suit }"
folded: ${ folded }
balance: ${ user.balance }`;

        return `${rv}`;
      }
    , broadcast = function ( msg ) {
        #s.chats.create({name:_ch});
        #s.chats.send({channel:_ch, msg});
      }
    , alert_current_player = function ( player ) {
        #s.chats.send({channel:_ch, msg:` @${player.uid}'s turn `});
      }

  return {
    broadcast
    , alert_current_player
    , render( user, view ) {
        let
          folded = false

        if ( _.is_empty( user ) ) {
          return spectator_view( view );
        }

        return user_view ( user, view );
      }
  }



}
