from algopy import (
    ARC4Contract,
    Asset,
    Global,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
)


class ParticipationToken(ARC4Contract):
    asset_id: UInt64
    quantity: UInt64

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create_application(self, asset_id: UInt64, quantity: UInt64) -> None:
        self.asset_id = asset_id
        self.quantity = quantity

    @arc4.abimethod
    def opt_in_to_asset(self, pay_txn: gtxn.PaymentTransaction) -> None:
        assert Txn.sender == Global.creator_address
        assert not Global.current_application_address.is_opted_in(Asset(self.asset_id))

        assert pay_txn.receiver == Global.current_application_address
        # assert pay_txn.amount == Global.min_balance + Global.asset_opt_in_min_balance

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Global.current_application_address,
            asset_amount=0,
        ).submit()


    @arc4.abimethod
    def claim(self) -> None:

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Txn.sender,
            asset_amount=1,
        ).submit()

    @arc4.abimethod(allow_actions=["DeleteApplication"])
    def delete_application(self) -> None:
        assert Txn.sender == Global.creator_address

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Global.creator_address,
            asset_amount=0,
            asset_close_to=Global.creator_address,
        ).submit()

        itxn.Payment(
            receiver=Global.creator_address,
            amount=0,
            close_remainder_to=Global.creator_address,
        ).submit()
