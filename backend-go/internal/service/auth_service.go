package service

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/model"
	"appmeta-backend/internal/repository"
	"crypto/sha256"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"gorm.io/gorm"
)

// ErrInvalidCredentials is returned when username/password do not match.
var ErrInvalidCredentials = errors.New("invalid credentials")

// ErrUsernameTaken is returned when the requested username already exists.
var ErrUsernameTaken = errors.New("username already taken")

// AuthService handles login/logout, registration, and token validation.
type AuthService interface {
	Login(username, password string) (*dto.LoginResponse, error)
	Register(req dto.RegisterRequest) (*dto.LoginResponse, error)
	Logout(token string) error
	ValidateToken(token string) (*model.AuthToken, error)
}

type authServiceImpl struct {
	userRepo  repository.UserRepository
	tokenRepo repository.AuthTokenRepository
}

func NewAuthService(userRepo repository.UserRepository, tokenRepo repository.AuthTokenRepository) AuthService {
	return &authServiceImpl{userRepo: userRepo, tokenRepo: tokenRepo}
}

func (s *authServiceImpl) Login(username, password string) (*dto.LoginResponse, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if user.PasswordHash != hashPassword(password) {
		return nil, ErrInvalidCredentials
	}

	token := generateToken()
	authToken := &model.AuthToken{
		Token:     token,
		UserID:    user.ID,
		Role:      user.Role,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	if err := s.tokenRepo.Create(authToken); err != nil {
		return nil, err
	}

	createdAt := user.CreatedAt.Format(time.RFC3339)
	return &dto.LoginResponse{
		Token: token,
		User: dto.UserInfoDTO{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			Phone:       user.Phone,
			Role:        user.Role,
			Avatar:      user.Avatar,
			CreatedAt:   createdAt,
		},
	}, nil
}

func (s *authServiceImpl) Register(req dto.RegisterRequest) (*dto.LoginResponse, error) {
	// Check username uniqueness.
	_, err := s.userRepo.FindByUsername(req.Username)
	if err == nil {
		return nil, ErrUsernameTaken
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	displayName := req.DisplayName
	if displayName == "" {
		displayName = req.Username
	}

	user := &model.User{
		ID:           generateToken()[:20],
		Username:     req.Username,
		DisplayName:  displayName,
		PasswordHash: hashPassword(req.Password),
		Email:        req.Email,
		Phone:        req.Phone,
		Role:         "user",
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Issue a session token immediately so the user is logged in after register.
	token := generateToken()
	authToken := &model.AuthToken{
		Token:     token,
		UserID:    user.ID,
		Role:      user.Role,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	if err := s.tokenRepo.Create(authToken); err != nil {
		return nil, err
	}

	createdAt := user.CreatedAt.Format(time.RFC3339)
	return &dto.LoginResponse{
		Token: token,
		User: dto.UserInfoDTO{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			Phone:       user.Phone,
			Role:        user.Role,
			CreatedAt:   createdAt,
		},
	}, nil
}

func (s *authServiceImpl) Logout(token string) error {
	return s.tokenRepo.Delete(token)
}

func (s *authServiceImpl) ValidateToken(token string) (*model.AuthToken, error) {
	t, err := s.tokenRepo.FindByToken(token)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUnauthorized
		}
		return nil, err
	}
	if t.ExpiresAt.Before(time.Now()) {
		_ = s.tokenRepo.Delete(token)
		return nil, ErrUnauthorized
	}
	return t, nil
}

// ErrUnauthorized is returned when the token is missing or expired.
var ErrUnauthorized = errors.New("unauthorized")

// hashPassword returns the SHA-256 hex digest of the password,
// matching the SHA2() function used in the MySQL seed INSERT.
func hashPassword(password string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(password)))
}

// generateToken produces a random 48-character hex string.
func generateToken() string {
	b := make([]byte, 24)
	rand.Read(b) //nolint:gosec
	return fmt.Sprintf("%x", b)
}
