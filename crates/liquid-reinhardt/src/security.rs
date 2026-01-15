// FR-07: Row-Level Security Implementation

use crate::converter::{ConversionError, ConvertedQuery, QueryCondition};
use std::collections::HashMap;

/// 現在のユーザーコンテキスト
#[derive(Debug, Clone)]
pub struct CurrentUser {
    id: u64,
    permissions: Vec<String>,
}

impl CurrentUser {
    pub fn new(id: u64, permissions: Vec<String>) -> Self {
        Self { id, permissions }
    }

    pub fn id(&self) -> u64 {
        self.id
    }

    pub fn permissions(&self) -> &[String] {
        &self.permissions
    }

    pub fn has_permission(&self, permission: &str) -> bool {
        self.permissions.iter().any(|p| p == permission)
    }
}

/// セキュリティポリシー
pub struct SecurityPolicy {
    name: String,
    policy_fn: Box<dyn Fn(&CurrentUser, &ConvertedQuery) -> bool + Send + Sync>,
    filter_field: Option<String>,
}

impl SecurityPolicy {
    /// カスタムポリシー関数を使用
    pub fn new<F>(name: impl Into<String>, policy_fn: F) -> Self
    where
        F: Fn(&CurrentUser, &ConvertedQuery) -> bool + Send + Sync + 'static,
    {
        Self {
            name: name.into(),
            policy_fn: Box::new(policy_fn),
            filter_field: None,
        }
    }

    /// カスタムフィールドでフィルタするポリシー
    pub fn custom_field(field_name: impl Into<String>) -> Self {
        let field = field_name.into();
        let field_clone = field.clone();

        Self {
            name: format!("custom_field_{}", field),
            policy_fn: Box::new(move |_user, _query| true),
            filter_field: Some(field_clone),
        }
    }

    /// ポリシー評価
    fn evaluate(&self, user: &CurrentUser, query: &ConvertedQuery) -> bool {
        (self.policy_fn)(user, query)
    }

    /// フィルタフィールド取得
    fn get_filter_field(&self) -> Option<&str> {
        self.filter_field.as_deref()
    }
}

/// Row-Level Security Enforcer
pub struct SecurityEnforcer {
    resource_policies: HashMap<String, SecurityPolicy>,
}

impl SecurityEnforcer {
    pub fn new() -> Self {
        Self {
            resource_policies: HashMap::new(),
        }
    }

    /// リソース別カスタムポリシーを追加
    pub fn add_policy_for_resource(&mut self, resource: impl Into<String>, policy: SecurityPolicy) {
        self.resource_policies.insert(resource.into(), policy);
    }

    /// RLSを適用
    pub fn enforce(
        &self,
        query: &mut ConvertedQuery,
        user: &CurrentUser,
    ) -> Result<(), ConversionError> {
        let resource = query.resource();

        // リソース別カスタムポリシーがあるか確認
        if let Some(policy) = self.resource_policies.get(resource) {
            return self.apply_custom_policy(query, user, policy);
        }

        // デフォルトポリシー: user_id = current_user.id
        self.apply_default_policy(query, user);

        Ok(())
    }

    /// デフォルトポリシー適用
    fn apply_default_policy(&self, query: &mut ConvertedQuery, user: &CurrentUser) {
        let user_id_condition = QueryCondition::Eq {
            field: "user_id".to_string(),
            value: user.id().to_string(),
        };

        query.add_condition(user_id_condition);
    }

    /// カスタムポリシー適用
    fn apply_custom_policy(
        &self,
        query: &mut ConvertedQuery,
        user: &CurrentUser,
        policy: &SecurityPolicy,
    ) -> Result<(), ConversionError> {
        // ポリシー評価
        if !policy.evaluate(user, query) {
            return Err(ConversionError::new(
                "ACCESS_DENIED",
                format!("Access denied by policy: {}", policy.name),
            ));
        }

        // カスタムフィールドがある場合はフィルタ追加
        if let Some(field) = policy.get_filter_field() {
            let condition = QueryCondition::Eq {
                field: field.to_string(),
                value: user.id().to_string(),
            };
            query.add_condition(condition);
        }

        Ok(())
    }
}

impl Default for SecurityEnforcer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_current_user_creation() {
        let user = CurrentUser::new(123, vec!["read".to_string()]);
        assert_eq!(user.id(), 123);
        assert_eq!(user.permissions().len(), 1);
    }

    #[test]
    fn test_has_permission() {
        let user = CurrentUser::new(1, vec!["admin".to_string(), "write".to_string()]);
        assert!(user.has_permission("admin"));
        assert!(user.has_permission("write"));
        assert!(!user.has_permission("delete"));
    }

    #[test]
    fn test_security_enforcer_new() {
        let enforcer = SecurityEnforcer::new();
        assert_eq!(enforcer.resource_policies.len(), 0);
    }

    #[test]
    fn test_add_policy() {
        let mut enforcer = SecurityEnforcer::new();
        let policy = SecurityPolicy::new("test", |_, _| true);

        enforcer.add_policy_for_resource("users", policy);
        assert_eq!(enforcer.resource_policies.len(), 1);
    }
}
