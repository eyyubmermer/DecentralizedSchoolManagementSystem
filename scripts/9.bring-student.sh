#!/usr/bin/env bash

# exit on first error after this point to avoid redeploying with successful build
set -e

[ -z "$CONTRACT" ] && echo "Missing \$CONTRACT environment variable"
[ -z "$ID" ] && echo "Missing \$ID environment variable"
[ -z "$MY_ACC" ] && echo "Missing \$MY_ACC environment variable"

[ -z "$CONTRACT" ] && echo "Please \export your account id to the \$CONTRACT variable!"
[ -z "$CONTRACT" ] && echo "export CONTRACT=__new_contract_account_id__"

[ -z "$ID" ] && echo "Please \export the id of the news to the \$ID variable!"
[ -z "$ID" ] && echo "export ID=__id_of_the_students__"

[ -z "$MY_ACC" ] && echo "Please \export your account id to the \$MY_ACC variable!"
[ -z "$MY_ACC" ] && echo "export MY_ACC=__your_account_name__"



echo ---------------------------------------------------------
echo "Step 1: Call 'bringStudent' functions on the contract"
echo ---------------------------------------------------------
echo "After all variables are exported, please use below function."
echo "near call $CONTRACT bringStudent '{"'"id"'" : "'$ID'"}' --accountId $MY_ACC"
echo 
echo
exit 0