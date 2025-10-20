import styled from "styled-components";

const AnimatedLoader = () => {
  return (
    <StyledWrapper>
      <p className="loading-words">
        We currently use the free tier of Render.com, <br></br>Please allow a
        moment for the page to load.
      </p>
      <div className="spinner" />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .loading-words {
    text-align: center;
    padding: 20px;
    font-size: 14px;
    color: #888;
  }
  .spinner {
    box-shadow: 0 0 0 7px #ff6b6b, inset 0 0 0 1px #ff6b6b;
    position: relative;
    height: 30px;
    width: 230px;
    border-radius: 8px;
    overflow: hidden;
    animation: rotate_5132 6s linear infinite;
  }

  .spinner:before {
    display: block;
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: #ffe5e5;
    animation: load_5123 6s linear infinite;
  }

  @keyframes rotate_5132 {
    0%,
    42% {
      transform: rotate(0deg);
    }

    48%,
    92% {
      transform: rotate(180deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes load_5123 {
    0% {
      width: 0;
    }

    40%,
    50% {
      width: 100%;
    }

    90%,
    100% {
      width: 0;
    }
  }
`;

export default AnimatedLoader;
