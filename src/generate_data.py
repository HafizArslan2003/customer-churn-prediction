import pandas as pd
import numpy as np
import os

def generate_data(num_samples=2000, output_path="../data/customers.csv"):
    np.random.seed(42)
    
    # account_age (days)
    account_age = np.random.randint(1, 1000, num_samples)
    
    # payment_amount (monthly subscription)
    payment_amount = np.random.uniform(10, 200, num_samples)
    
    # login_frequency (logins per week)
    login_frequency = np.random.poisson(lam=5, size=num_samples)
    
    # feature_usage_count (number of product features used)
    feature_usage_count = np.random.poisson(lam=10, size=num_samples)
    
    # support_ticket_volume (number of support tickets opened)
    support_ticket_volume = np.random.poisson(lam=1, size=num_samples)
    
    # Generate logical churn label
    # High support tickets -> high churn
    # Low logins -> high churn
    # Low feature usage -> high churn
    
    churn_prob = (
        0.1 +
        (support_ticket_volume * 0.15) -
        (login_frequency * 0.05) -
        (feature_usage_count * 0.02) -
        (account_age * 0.0001)
    )
    
    # Add some noise
    churn_prob += np.random.normal(0, 0.1, num_samples)
    
    # Clip probabilities between 0 and 1
    churn_prob = np.clip(churn_prob, 0, 1)
    
    churned = np.random.binomial(1, churn_prob)
    
    df = pd.DataFrame({
        'login_frequency': login_frequency,
        'feature_usage_count': feature_usage_count,
        'support_ticket_volume': support_ticket_volume,
        'payment_amount': payment_amount,
        'account_age': account_age,
        'churned': churned
    })
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Dataset generated at {output_path} with {num_samples} rows.")
    print("Class distribution:")
    print(df['churned'].value_counts())

if __name__ == "__main__":
    # If run from src/, output path should be ../data/customers.csv
    # Adjust path if needed
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "../data/customers.csv")
    generate_data(output_path=output_path)
