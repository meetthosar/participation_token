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
        assert pay_txn.amount == Global.min_balance + Global.asset_opt_in_min_balance

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Global.current_application_address,
            asset_amount=0,
        ).submit()

        # itxn.AssetTransfer(
        #     xfer_asset=self.asset_id,
        #     asset_receiver=Global.current_application_address,
        #     asset_amount=self.quantity,
        #     sender=Global.creator_address,
        # ).submit()

        # itxn.Payment(
        #     receiver=Global.current_application_address,
        #     amount=(
        #         self.quantity * (Global.min_balance + Global.asset_opt_in_min_balance)
        #     ),
        #     sender=Global.creator_address,
        # ).submit()

        # itxn.submit_txns(opt_in, asset_xfer, algo_xfer)

    @arc4.abimethod
    def opt_in_before_claim(self) -> None:
        assert not Txn.sender.is_opted_in(Asset(self.asset_id))

        # if Txn.sender.balance < Global.min_balance + Global.asset_opt_in_min_balance:
        #     itxn.Payment(
        #         receiver=Txn.sender,
        #         amount=Global.min_balance + Global.asset_opt_in_min_balance,
        #         sender=Global.current_application_address,
        #     ).submit()

        itxn.AssetTransfer(
            xfer_asset=self.asset_id, asset_receiver=Txn.sender, asset_amount=0
        ).submit()

    @arc4.abimethod
    def claim(self) -> None:

        # assert not Txn.sender.is_opted_in(Asset(self.asset_id))

        # itxn.AssetTransfer(
        #     xfer_asset=self.asset_id, asset_receiver=Txn.sender, asset_amount=0
        # ).submit()

        itxn.AssetTransfer(
            xfer_asset=self.asset_id, asset_receiver=Txn.sender, asset_amount=1
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
