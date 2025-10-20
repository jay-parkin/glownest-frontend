import React from "react";
import styled from "styled-components";

const AnimatedSpinner = () => {
  return (
    <StyledWrapper>
      <div className="loader" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .loader {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: transparent;
    border-radius: 50%;
  }

  .loader {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: transparent;
    width: 36px;
    height: 36px;
  }

  .loader {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: transparent;
    width: 36px;
    height: 36px;
    animation: spin89345 1s linear infinite;
  }

  .loader {
    border: 4px solid rgba(255, 107, 107, 0.25);
    border-top-color: #ff6b6b; /* pink arc */
  }

  @keyframes spin89345 {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

export default AnimatedSpinner;
