import pandas as pd
import numpy as np
import os

def prepare_data(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: Could not find '{input_path}'.")
        print("Please download the Telco Churn dataset and save it as 'telco_churn.csv' in the 'data/' folder.")
        return
        
    df = pd.read_csv(input_path)
    
    # 1. account_age: Map 'tenure' (months) to days
    account_age = df['tenure'] * 30
    
    # 2. payment_amount: Map directly from 'MonthlyCharges'
    payment_amount = df['MonthlyCharges']
    
    # 3. feature_usage_count: Engineer by counting the number of subscribed services
    services = ['PhoneService', 'MultipleLines', 'OnlineSecurity', 'OnlineBackup', 
                'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies']
    
    feature_usage_count = pd.Series(np.zeros(len(df)), index=df.index)
    for col in services:
        if col in df.columns:
            feature_usage_count += (df[col] == 'Yes').astype(int)
            
    # 4. support_ticket_volume (Proxy Feature)
    # Engineered based on service type and tech support status + some randomness
    np.random.seed(42)
    support_ticket_volume = np.zeros(len(df))
    if 'TechSupport' in df.columns:
        # Customers without tech support might end up opening more generic tickets
        support_ticket_volume += (df['TechSupport'] == 'No').astype(int) * 2
    if 'InternetService' in df.columns:
        # Fiber optic customers historically had more issues in this dataset
        support_ticket_volume += (df['InternetService'] == 'Fiber optic').astype(int) * 1
    
    support_ticket_volume += np.random.poisson(lam=1, size=len(df)) # Add realistic noise
    
    # 5. login_frequency (Proxy Feature)
    # Engineered assuming customers with more features (e.g. streaming) log in more often
    login_frequency = feature_usage_count * 2 + np.random.poisson(lam=2, size=len(df))
    
    # 6. Target: churned (Map 'Yes'/'No' to 1/0)
    churned = (df['Churn'] == 'Yes').astype(int)
    
    # Compile final dataset
    final_df = pd.DataFrame({
        'login_frequency': login_frequency,
        'feature_usage_count': feature_usage_count,
        'support_ticket_volume': support_ticket_volume,
        'payment_amount': payment_amount,
        'account_age': account_age,
        'churned': churned
    })
    
    # Drop any potential NaNs
    final_df = final_df.dropna()
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_df.to_csv(output_path, index=False)
    print(f"Processed Telco data mapped and saved to {output_path} with {len(final_df)} rows.")
    print("Class distribution:")
    print(final_df['churned'].value_counts())

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(current_dir, "../data/telco_churn.csv")
    output_path = os.path.join(current_dir, "../data/customers.csv")
    prepare_data(input_path, output_path)
