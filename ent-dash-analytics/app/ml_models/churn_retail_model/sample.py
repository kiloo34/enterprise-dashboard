import os
from pprint import pprint
from dataikuscoring import load_model


path_to_export = os.path.dirname(os.path.realpath(__file__))

# Load the model from current export path
model = load_model(path_to_export)

# The model provides a simple api similar to scikit-learn with:
# * model.predict to get scoring for a given input data
# * model.predict_proba to get probabilities in case of classification
#
# The accepted format for input data can be either:
# * pandas.DataFrame
# * List of dictionnaries
# * 2D numpy array
# * List of List
#
# The first dimension corresponds to observations
data_to_score = [
    {
        "no_rekening": "5<$6&$88&G"
        ,"observation_date": "2022-12-31"
        ,"cif": "5<$m%&C3"
        ,"n_trx_12m": 48
        ,"n_ci_any_12m": 35
        ,"n_ci_debit_12m": 15
        ,"n_ci_credit_12m": 20
        ,"n_debit_12m": 28
        ,"n_credit_12m": 20
        ,"months_active_12m": 12
        ,"total_debit_amt_12m": 16.57962604603126
        ,"total_credit_amt_12m": 16.58167248502667
        ,"avg_debit_amt_12m": 13.247423237713942
        ,"max_debit_amt_12m": 14.53335083891935
        ,"avg_credit_amt_12m": 13.585941406628361
        ,"max_credit_amt_12m": 14.53821702620254
        ,"total_ci_debit_amt_12m": 16.575520561288332
        ,"days_since_last_ci_any": 23
        ,"days_since_last_ci_debit": 23
        ,"days_since_last_ci_credit": 23
        ,"n_ci_any_last_30d": 2
        ,"n_ci_debit_last_30d": 1
        ,"amt_debit_last_30d": 905000.0
        ,"n_ci_any_last_60d": 4
        ,"amt_debit_last_60d": 1810000.0
        ,"n_ci_any_last_90d": 6
        ,"amt_debit_last_90d": 3865000.0
        ,"n_ci_any_last_180d": 15
        ,"amt_debit_last_180d": 6930000.0
        ,"n_mb_12m": 0
        ,"n_non_mb_12m": 48
        ,"pct_mb_12m": 0.0
        ,"mb_debit_amt_12m": 0.0
        ,"n_unique_user_trx": 8
        ,"n_unique_keterangan_12m": 5
        ,"avg_saldo_12m": 13.025044581013002
        ,"min_saldo_observed_12m": 8.810799679807959
        ,"max_saldo_12m": 14.564190018702979
        ,"saldo_volatility_12m": 528654.765978055
        ,"days_since_first_trx_in_window": 337
        ,"saldo_at_obs": 49205.28
        ,"min_saldo": 10.819798284210286
        ,"saldo_gap_to_min": -794.7200000000012
        ,"saldo_minus_min_pct": -0.0158944
        ,"is_above_min_saldo": 0
        ,"umur": 28.0
        ,"jenis_rekening": "TABUNGAN SIKLUS"
        ,"kode_rekening": "T02"
        ,"cabang": 74
        ,"name_cabang": "CAPEM UNTAG"
        ,"account_age_days_at_obs": 720
        ,"customer_type": "RETAIL"
        ,"jenis": "KONVEN"
        ,"split": "train"
    }
    ,{
        "no_rekening": "5<$6&$88&G"
        ,"observation_date": "2023-12-31"
        ,"cif": "5<$m%&C3"
        ,"n_trx_12m": 35
        ,"n_ci_any_12m": 21
        ,"n_ci_debit_12m": 14
        ,"n_ci_credit_12m": 7
        ,"n_debit_12m": 28
        ,"n_credit_12m": 7
        ,"months_active_12m": 12
        ,"total_debit_amt_12m": 16.134952866353157
        ,"total_credit_amt_12m": 16.134952866353157
        ,"avg_debit_amt_12m": 12.802751011041423
        ,"max_debit_amt_12m": 14.603968372873895
        ,"avg_credit_amt_12m": 14.189043307268111
        ,"max_credit_amt_12m": 14.603968372873895
        ,"total_ci_debit_amt_12m": 16.128046080821385
        ,"days_since_last_ci_any": 87
        ,"days_since_last_ci_debit": 87
        ,"days_since_last_ci_credit": 87
        ,"n_ci_any_last_30d": 0
        ,"n_ci_debit_last_30d": 0
        ,"amt_debit_last_30d": 5000.0
        ,"n_ci_any_last_60d": 0
        ,"amt_debit_last_60d": 10000.0
        ,"n_ci_any_last_90d": 2
        ,"amt_debit_last_90d": 1865000.0
        ,"n_ci_any_last_180d": 4
        ,"amt_debit_last_180d": 3880000.0
        ,"n_mb_12m": 0
        ,"n_non_mb_12m": 35
        ,"pct_mb_12m": 0.0
        ,"mb_debit_amt_12m": 0.0
        ,"n_unique_user_trx": 8
        ,"n_unique_keterangan_12m": 7
        ,"avg_saldo_12m": 13.054831874332908
        ,"min_saldo_observed_12m": 10.282139033625612
        ,"max_saldo_12m": 14.637141661579554
        ,"saldo_volatility_12m": 663272.9516596929
        ,"days_since_first_trx_in_window": 337
        ,"saldo_at_obs": 49205.28
        ,"min_saldo": 10.819798284210286
        ,"saldo_gap_to_min": -794.7200000000012
        ,"saldo_minus_min_pct": -0.0158944
        ,"is_above_min_saldo": 0
        ,"umur": 28.0
        ,"jenis_rekening": "TABUNGAN SIKLUS"
        ,"kode_rekening": "T02"
        ,"cabang": 74
        ,"name_cabang": "CAPEM UNTAG"
        ,"account_age_days_at_obs": 1085
        ,"customer_type": "RETAIL"
        ,"jenis": "KONVEN"
        ,"split": "train"
    }
]


# For instance the following will output a numpy array containing the predictions for each
# observation

predict_result = model.predict(data_to_score)
print(" \nOutput of model.predict():\n")
pprint(predict_result)

# In case of classification the following will output a dictionnary of numpy array with
# probabilities for each class
predict_proba_result = model.predict_proba(data_to_score)
print(" \nOutput of model.predict_proba():\n")
pprint(predict_proba_result)
